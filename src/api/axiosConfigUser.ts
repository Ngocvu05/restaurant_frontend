import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenManager } from './axiosApiConfig';

// Extend AxiosRequestConfig để thêm _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Instance cho Users API
 * Sử dụng same-origin pattern như axiosApiConfig
 * Nginx proxy: /api/users -> api-gateway:8080/users
 */
export const usersApi = axios.create({
  baseURL: '/api/users/api',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Public endpoints that don't require authentication
 */
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/oauth/google',
  '/auth/oauth/facebook',
  '/home',
  '/health',
  '/public'
];

/**
 * Check if endpoint is public
 */
function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

// Request interceptor: set token vào header cho protected endpoints
usersApi.interceptors.request.use(
  (config) => {
    // Kiểm tra các endpoint public không cần token
    const isPublic = isPublicEndpoint(config.url);

    if (!isPublic) {
      const token = TokenManager.getAccessToken();
      if (token && !TokenManager.isTokenExpired(token)) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Thêm request metadata
    config.headers = config.headers ?? {};
    config.headers['X-User-Client'] = 'web';
    config.headers['X-Request-ID'] = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log user API requests trong development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Users API Request [${config.method?.toUpperCase()}] ${config.url}`, {
        isPublic,
        hasAuth: !!config.headers.Authorization
      });
    }

    return config;
  },
  (error) => {
    console.error('Users API request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: handle errors globally với refresh token
usersApi.interceptors.response.use(
  (response) => {
    // Log successful responses trong development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Users API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, response.status);
    }

    // Handle successful login/register - store tokens
    if (response.config.url?.includes('/auth/login') || 
        response.config.url?.includes('/auth/register') ||
        response.config.url?.includes('/auth/oauth/')) {
      const { token, refreshToken } = response.data;
      if (token) {
        TokenManager.setTokens(token, refreshToken);
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Log errors
    console.error('Users API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message
    });

    // Xử lý 401 với refresh token cho protected endpoints
    if (error.response?.status === 401 && 
        originalRequest && 
        !originalRequest._retry &&
        !isPublicEndpoint(originalRequest.url)) {
      
      originalRequest._retry = true;

      const refreshToken = TokenManager.getRefreshToken();
      
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          // Sử dụng axios instance mới để tránh interceptor loop
          const refreshResponse = await axios.post('/api/users/api/auth/refresh-token', {
            refreshToken: refreshToken
          }, {
            withCredentials: true,
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data;

          if (newToken) {
            // Cập nhật tokens
            TokenManager.setTokens(newToken, newRefreshToken);

            // Retry original request với token mới
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            return usersApi(originalRequest);
          }
        } catch (refreshError) {
          console.error('Users API token refresh failed:', refreshError);
          // Refresh token thất bại - clear storage và redirect
          TokenManager.clearTokens();
          redirectToLogin('Session expired');
          return Promise.reject(refreshError);
        }
      } else {
        // Không có refresh token hoặc đã expired - redirect login
        TokenManager.clearTokens();
        redirectToLogin('Authentication required');
      }
    }

    // Handle user-specific errors
    handleUserErrors(error);

    return Promise.reject(error);
  }
);

/**
 * Handle user-specific errors
 */
function handleUserErrors(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data as any;
  
  switch (status) {
    case 400:
      if (data?.message?.includes('email')) {
        console.warn('Invalid email format or email already exists');
      } else if (data?.message?.includes('password')) {
        console.warn('Invalid password format or password too weak');
      } else {
        console.warn('Bad request - check input data');
      }
      break;
    case 403:
      console.warn('Access forbidden - insufficient permissions or account locked');
      break;
    case 404:
      if (error.config?.url?.includes('/auth/')) {
        console.warn('Authentication endpoint not found');
      } else {
        console.warn('User or resource not found');
      }
      break;
    case 409:
      console.warn('Conflict - user already exists or duplicate data');
      break;
    case 422:
      console.warn('Validation error - check required fields');
      break;
    case 429:
      console.warn('Rate limit exceeded - too many login attempts');
      break;
    default:
      if (status && status >= 500) {
        console.error('User service error - authentication may be unavailable');
      }
  }

  // Log specific error details
  if (data && (data.message || data.errors)) {
    console.error('Users API Error Details:', data.message || data.errors);
  }
}

/**
 * Redirect to login with user context
 */
function redirectToLogin(reason?: string) {
  if (window.location.pathname !== '/login') {
    // Store current location và reason
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    if (reason) {
      sessionStorage.setItem('loginReason', reason);
    }
    
    window.location.href = '/login';
  }
}

/**
 * User-specific utilities
 */
export const userUtils = {
  // Check if user service is available
  checkUserHealth: async () => {
    try {
      const response = await usersApi.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },
  
  // Login with email/password
  login: async (email: string, password: string) => {
    const response = await usersApi.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password
    });
    return response.data;
  },
  
  // Register new user
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await usersApi.post('/auth/register', {
      ...userData,
      email: userData.email.trim().toLowerCase()
    });
    return response.data;
  },
  
  // OAuth login
  oauthLogin: async (provider: 'google' | 'facebook', code: string, redirectUri?: string) => {
    const response = await usersApi.post(`/auth/oauth/${provider}`, {
      code,
      redirectUri
    });
    return response.data;
  },
  
  // Get current user profile
  getCurrentUserProfile: async () => {
    const response = await usersApi.get('/profile');
    return response.data;
  },
  
  // Update user profile
  updateProfile: async (profileData: any) => {
    const response = await usersApi.put('/profile', profileData);
    return response.data;
  },
  
  // Logout
  logout: async () => {
    try {
      await usersApi.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, clearing local tokens anyway');
    } finally {
      TokenManager.clearTokens();
      window.location.href = '/login';
    }
  },
  
  // Validate email format
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validate password strength
  validatePassword: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default usersApi;