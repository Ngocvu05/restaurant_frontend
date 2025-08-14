import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenManager } from './axiosApiConfig';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Instance cho Users API
 * Frontend call: /users/* -> nginx proxy -> gateway: /users/*
 * 
 * UPDATED: Sử dụng /users để match với nginx routing mới
 */
export const usersApi = axios.create({
  baseURL: '/users',  // Thay đổi từ '/users' thành '/users' trực tiếp
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

usersApi.interceptors.request.use(
  (config) => {
    const isPublic = isPublicEndpoint(config.url);

    // Add authentication for non-public endpoints
    if (!isPublic) {
      const token = TokenManager.getAccessToken();
      if (token && !TokenManager.isTokenExpired(token)) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add custom headers for debugging
    config.headers = config.headers ?? {};
    config.headers['X-User-Client'] = 'web';
    config.headers['X-Request-ID'] = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Users API Request [${config.method?.toUpperCase()}] ${config.url}`, {
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        isPublic,
        hasAuth: !!config.headers.Authorization
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Users API request interceptor error:', error);
    return Promise.reject(error);
  }
);

usersApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Users API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
        status: response.status,
        data: response.data
      });
    }

    // Handle authentication responses
    if (response.config.url?.includes('/auth/login') || 
        response.config.url?.includes('/auth/register') ||
        response.config.url?.includes('/auth/oauth/')) {
      const { token, refreshToken } = response.data;
      if (token) {
        TokenManager.setTokens(token, refreshToken);
        console.log('🔑 Tokens updated after successful auth');
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    console.error('❌ Users API Error:', {
      url: originalRequest?.url,
      fullURL: `${originalRequest?.baseURL}${originalRequest?.url}`,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data
    });

    // Handle 401 with refresh token logic
    if (error.response?.status === 401 && 
        originalRequest && 
        !originalRequest._retry &&
        !isPublicEndpoint(originalRequest.url)) {
      
      originalRequest._retry = true;

      const refreshToken = TokenManager.getRefreshToken();
      
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          console.log('🔄 Attempting token refresh...');
          
          // UPDATED: Sử dụng /users/api/v1/auth/refresh-token thay vì /api/users/api/v1/auth/refresh-token
          const refreshResponse = await axios.post('/users/api/v1/auth/refresh-token', {
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
            TokenManager.setTokens(newToken, newRefreshToken);
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            console.log('✅ Token refreshed successfully, retrying original request');
            return usersApi(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Users API token refresh failed:', refreshError);
          TokenManager.clearTokens();
          redirectToLogin('Session expired');
          return Promise.reject(refreshError);
        }
      } else {
        console.log('🚫 No valid refresh token, redirecting to login');
        TokenManager.clearTokens();
        redirectToLogin('Authentication required');
      }
    }

    handleUserErrors(error);
    return Promise.reject(error);
  }
);

function handleUserErrors(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data as any;
  
  switch (status) {
    case 400:
      if (data?.message?.includes('email')) {
        console.warn('⚠️ Invalid email format or email already exists');
      } else if (data?.message?.includes('password')) {
        console.warn('⚠️ Invalid password format or password too weak');
      } else {
        console.warn('⚠️ Bad request - check input data');
      }
      break;
    case 403:
      console.warn('⚠️ Access forbidden - insufficient permissions or account locked');
      break;
    case 404:
      if (error.config?.url?.includes('/auth/')) {
        console.warn('⚠️ Authentication endpoint not found - check API routing');
      } else {
        console.warn('⚠️ User or resource not found');
      }
      break;
    case 409:
      console.warn('⚠️ Conflict - user already exists or duplicate data');
      break;
    case 422:
      console.warn('⚠️ Validation error - check required fields');
      break;
    case 429:
      console.warn('⚠️ Rate limit exceeded - too many login attempts');
      break;
    default:
      if (status && status >= 500) {
        console.error('❌ User service error - authentication may be unavailable');
      }
  }

  if (data && (data.message || data.errors)) {
    console.error('📋 Users API Error Details:', data.message || data.errors);
  }
}

function redirectToLogin(reason?: string) {
  if (window.location.pathname !== '/login') {
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    if (reason) {
      sessionStorage.setItem('loginReason', reason);
    }
    
    console.log(`🔄 Redirecting to login: ${reason || 'Authentication required'}`);
    window.location.href = '/login';
  }
}

// ===== ENHANCED USER UTILS =====
export const userUtils = {
  // Health check với proper error handling
  checkUserHealth: async () => {
    try {
      const response = await usersApi.get('/health');
      console.log('✅ User service health check passed');
      return response.status === 200;
    } catch (error) {
      console.error('❌ User service health check failed:', error);
      return false;
    }
  },
  
  // Test API connectivity 
  testAPIConnection: async () => {
    try {
      console.log('🧪 Testing API connection...');
      // UPDATED: Sử dụng /users/api/v1/health thay vì /api/users/api/v1/health
      const response = await axios.get('/users/api/v1/health', {
        timeout: 5000
      });
      console.log('✅ API connection test passed:', response.status);
      return true;
    } catch (error: any) {
      console.error('❌ API connection test failed:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url
      });
      return false;
    }
  },
  
  login: async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await usersApi.post('/api/v1/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });
      console.log('✅ Login successful');
      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },
  
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      console.log('🔐 Attempting registration for:', userData.email);
      const response = await usersApi.post('/api/v1/auth/register', {
        ...userData,
        email: userData.email.trim().toLowerCase()
      });
      console.log('✅ Registration successful');
      return response.data;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  },
  
  getCurrentUserProfile: async () => {
    try {
      const response = await usersApi.get('/api/v1/profile');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await usersApi.post('/api/v1/auth/logout');
      console.log('✅ Logout API call successful');
    } catch (error) {
      console.warn('⚠️ Logout API call failed, clearing local tokens anyway');
    } finally {
      TokenManager.clearTokens();
      console.log('🧹 Local tokens cleared');
      window.location.href = '/login';
    }
  },
  
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
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