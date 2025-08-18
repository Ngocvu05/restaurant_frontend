import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenManager, apiUtils } from './axiosApiConfig';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Instance cho Users Service
 * 
 * Routing flow:
 * Frontend: localhost:3000/users/api/v1/* 
 * -> Nginx proxy: /users/* 
 * -> API Gateway: /users/** (StripPrefix=1)
 * -> User Service: /api/v1/*
 * 
 * Public endpoints không cần authentication
 */
export const usersApi = axios.create({
  baseURL: '/users/api/v1',  // Match với nginx proxy và gateway routing
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Define public endpoints that don't require authentication
 */
const PUBLIC_ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register', 
  '/api/v1/auth/refresh-token',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/oauth/google',
  '/api/v1/auth/oauth/facebook',
  '/api/v1/public',
  '/health'
];

/**
 * Check if endpoint is public (doesn't need authentication)
 */
function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

/**
 * Request interceptor cho Users API
 */
usersApi.interceptors.request.use(
  (config) => {
    const isPublic = isPublicEndpoint(config.url);

    // Add authentication cho non-public endpoints
    if (!isPublic) {
      const token = TokenManager.getAccessToken();
      if (token && !TokenManager.isTokenExpired(token)) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add custom headers for user service
    config.headers = config.headers ?? {};
    config.headers['X-Service'] = 'user-service';
    config.headers['X-Client-Type'] = 'web';
    config.headers['X-Request-ID'] = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`👤 Users API Request [${config.method?.toUpperCase()}] ${config.url}`, {
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

/**
 * Response interceptor cho Users API
 */
usersApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Users API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
        status: response.status,
        hasData: !!response.data
      });
    }

    // Handle authentication responses - auto save tokens
    const authEndpoints = ['/api/v1/auth/login', '/api/v1/auth/register'];
    const isAuthResponse = authEndpoints.some(endpoint => 
      response.config.url?.includes(endpoint)
    );
    
    if (isAuthResponse && response.data) {
      const { token, refreshToken, access_token, refresh_token } = response.data;
      const accessToken = token || access_token;
      const refToken = refreshToken || refresh_token;
      
      if (accessToken) {
        TokenManager.setTokens(accessToken, refToken);
        console.log('🔐 Authentication tokens saved after successful auth');
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Enhanced error logging cho Users API
    console.error('❌ Users API Error:', {
      url: originalRequest?.url,
      fullURL: `${originalRequest?.baseURL}${originalRequest?.url}`,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data
    });

    // Handle 401 với refresh token logic
    if (error.response?.status === 401 && 
        originalRequest && 
        !originalRequest._retry &&
        !isPublicEndpoint(originalRequest.url)) {
      
      originalRequest._retry = true;
      const refreshToken = TokenManager.getRefreshToken();
      
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          console.log('🔄 Users API attempting token refresh...');
          
          // Call refresh token endpoint
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
            
            console.log('✅ Users API token refreshed, retrying request');
            return usersApi(originalRequest);
          }
        } catch (refreshError: any) {
          console.error('❌ Users API token refresh failed:', refreshError);
          TokenManager.clearTokens();
          redirectToLogin('Session expired');
          return Promise.reject(refreshError);
        }
      } else {
        console.log('🚫 No valid refresh token for Users API');
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
 * Handle user service specific errors
 */
function handleUserErrors(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data as any;
  
  switch (status) {
    case 400:
      if (data?.message?.includes('email')) {
        console.warn('⚠️ Invalid email format or email already exists');
      } else if (data?.message?.includes('password')) {
        console.warn('⚠️ Invalid password format or password requirements not met');
      } else {
        console.warn('⚠️ Bad request - check input data format');
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
      console.warn('⚠️ Validation error - check required fields and format');
      break;
    case 429:
      console.warn('⚠️ Rate limit exceeded - too many authentication attempts');
      break;
    case 503:
      console.error('❌ User service unavailable - authentication may be down');
      break;
    default:
      if (status && status >= 500) {
        console.error('❌ User service error - authentication may be unavailable');
      }
  }

  // Log specific error details
  if (data && (data.message || data.errors || data.error)) {
    console.error('📋 Users API Error Details:', data.message || data.errors || data.error);
  }
}

/**
 * Redirect to login với user service context
 */
function redirectToLogin(reason?: string) {
  if (window.location.pathname !== '/login') {
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    if (reason) {
      sessionStorage.setItem('loginReason', reason);
    }
    
    console.log(`🔄 Users API redirecting to login: ${reason || 'Authentication required'}`);
    window.location.href = '/login';
  }
}

/**
 * Enhanced User Service Utilities
 */
export const userUtils = {
  // Health check cho user service
  checkUserHealth: async (): Promise<boolean> => {
    try {
      const response = await usersApi.get('/health', { timeout: 5000 });
      console.log('✅ User service health check passed');
      return response.status === 200;
    } catch (error) {
      console.error('❌ User service health check failed:', error);
      return false;
    }
  },
  
  // Test connectivity to user service
  testConnection: async (): Promise<boolean> => {
    try {
      console.log('🧪 Testing Users API connection...');
      const response = await usersApi.get('/api/v1/health', { timeout: 5000 });
      console.log('✅ Users API connection test passed:', response.status);
      return true;
    } catch (error: any) {
      console.error('❌ Users API connection test failed:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url
      });
      return false;
    }
  },
  
  // Enhanced login function
  login: async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email.replace(/(.{2})(.*)(@.*)/, '$1***$3'));
      
      const response = await usersApi.post('/api/v1/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });
      
      console.log('✅ Login successful');
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      throw error;
    }
  },
  
  // Enhanced register function
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    [key: string]: any;
  }) => {
    try {
      console.log('📝 Attempting registration for:', 
        userData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'));
      
      const response = await usersApi.post('/api/v1/auth/register', {
        ...userData,
        email: userData.email.trim().toLowerCase()
      });
      
      console.log('✅ Registration successful');
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      throw error;
    }
  },
  
  // Get current user profile
  getCurrentUserProfile: async () => {
    try {
      const response = await usersApi.get('/api/v1/profile');
      console.log('✅ User profile retrieved');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get user profile:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateUserProfile: async (profileData: any) => {
    try {
      const response = await usersApi.put('/api/v1/profile', profileData);
      console.log('✅ User profile updated');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  },
  
  // Enhanced logout function
  logout: async () => {
    try {
      await usersApi.post('/api/v1/auth/logout');
      console.log('✅ Logout API call successful');
    } catch (error) {
      console.warn('⚠️ Logout API call failed, clearing local tokens anyway');
    } finally {
      TokenManager.clearTokens();
      console.log('🧹 Local authentication tokens cleared');
      window.location.href = '/login';
    }
  },
  
  // Refresh token manually
  refreshToken: async () => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await usersApi.post('/api/v1/auth/refresh-token', {
        refreshToken
      });
      
      const { token, refreshToken: newRefreshToken } = response.data;
      TokenManager.setTokens(token, newRefreshToken);
      
      console.log('✅ Token refreshed manually');
      return response.data;
    } catch (error) {
      console.error('❌ Manual token refresh failed:', error);
      throw error;
    }
  },
  
  // Validation utilities
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
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
  },
  
  // Get current user from token
  getCurrentUser: () => {
    return apiUtils.getCurrentUser();
  }
};

export default usersApi;