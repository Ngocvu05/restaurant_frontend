import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenManager, apiUtils } from '../../api/axiosApiConfig';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Instance cho Admin Service
 * 
 * Routing flow:
 * Frontend: localhost:3000/admin/api/v1/*
 * -> Nginx proxy: /admin/*
 * -> API Gateway: /admin/** (StripPrefix=1)
 * -> Admin Service: /api/v1/*
 */
export const adminApi = axios.create({
  baseURL: '/users/api/v1',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Admin endpoints - tất cả đều yêu cầu authentication và admin role
 */
const ADMIN_ENDPOINTS = [
  '/admin/notifications',
  '/admin/users',
  '/admin/dashboard',
  '/admin/settings'
];

/**
 * Check if endpoint requires admin authentication
 */
function isAdminEndpoint(url?: string): boolean {
  if (!url) return false;
  return ADMIN_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

/**
 * Request interceptor cho Admin API
 */
adminApi.interceptors.request.use(
  (config) => {
    // Tất cả admin endpoints đều cần authentication
    const token = TokenManager.getAccessToken();
    if (token && !TokenManager.isTokenExpired(token)) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.error('❌ No valid access token for admin API');
      throw new Error('Authentication required for admin access');
    }

    // Add admin-specific headers
    config.headers = config.headers ?? {};
    config.headers['X-Service'] = 'admin-service';
    config.headers['X-Client-Type'] = 'admin-web';
    config.headers['X-Admin-Request'] = 'true';
    config.headers['X-Request-ID'] = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🛡️ Admin API Request [${config.method?.toUpperCase()}] ${config.url}`, {
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasAuth: !!config.headers.Authorization,
        isAdminEndpoint: isAdminEndpoint(config.url)
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Admin API request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor cho Admin API
 */
adminApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Admin API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
        status: response.status,
        hasData: !!response.data
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Enhanced error logging cho Admin API
    console.error('❌ Admin API Error:', {
      url: originalRequest?.url,
      fullURL: `${originalRequest?.baseURL}${originalRequest?.url}`,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data
    });

    // Handle 401/403 với refresh token logic
    if ((error.response?.status === 401 || error.response?.status === 403) && 
        originalRequest && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      const refreshToken = TokenManager.getRefreshToken();
      
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          console.log('🔄 Admin API attempting token refresh...');
          
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
            
            console.log('✅ Admin API token refreshed, retrying request');
            return adminApi(originalRequest);
          }
        } catch (refreshError: any) {
          console.error('❌ Admin API token refresh failed:', refreshError);
          TokenManager.clearTokens();
          redirectToLogin('Admin session expired');
          return Promise.reject(refreshError);
        }
      } else {
        console.log('🚫 No valid refresh token for Admin API');
        TokenManager.clearTokens();
        redirectToLogin('Admin authentication required');
      }
    }

    // Handle admin-specific errors
    handleAdminErrors(error);
    return Promise.reject(error);
  }
);

/**
 * Handle admin service specific errors
 */
function handleAdminErrors(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data as any;
  
  switch (status) {
    case 401:
      console.warn('⚠️ Admin unauthorized - invalid or expired token');
      break;
    case 403:
      console.warn('⚠️ Admin access forbidden - insufficient admin privileges');
      break;
    case 404:
      console.warn('⚠️ Admin resource not found');
      break;
    case 429:
      console.warn('⚠️ Admin API rate limit exceeded');
      break;
    case 503:
      console.error('❌ Admin service unavailable');
      break;
    default:
      if (status && status >= 500) {
        console.error('❌ Admin service error - may be temporarily unavailable');
      }
  }

  // Log specific error details
  if (data && (data.message || data.errors || data.error)) {
    console.error('📋 Admin API Error Details:', data.message || data.errors || data.error);
  }
}

/**
 * Redirect to login với admin context
 */
function redirectToLogin(reason?: string) {
  if (window.location.pathname !== '/login') {
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    sessionStorage.setItem('requiresAdmin', 'true');
    
    if (reason) {
      sessionStorage.setItem('loginReason', reason);
    }
    
    console.log(`🔄 Admin API redirecting to login: ${reason || 'Admin authentication required'}`);
    window.location.href = '/login';
  }
}

/**
 * Admin Service Utilities
 */
export const adminUtils = {
  // Check admin permissions
  checkAdminAccess: async (): Promise<boolean> => {
    try {
      // Sử dụng apiUtils.getCurrentUser() thay vì TokenManager.getCurrentUser()
      const user = apiUtils.getCurrentUser();
      if (!user || !user.roles?.includes('ADMIN')) {
        console.warn('⚠️ Current user does not have admin role');
        return false;
      }
      
      // Test với một endpoint đơn giản
      await adminApi.get('/admin/notifications/?limit=1');
      console.log('✅ Admin access verified');
      return true;
    } catch (error) {
      console.error('❌ Admin access check failed:', error);
      return false;
    }
  },
  
  // Health check cho admin service
  checkAdminHealth: async (): Promise<boolean> => {
    try {
      const response = await adminApi.get('/health', { timeout: 5000 });
      console.log('✅ Admin service health check passed');
      return response.status === 200;
    } catch (error) {
      console.error('❌ Admin service health check failed:', error);
      return false;
    }
  },
  
  // Get current admin user
  getCurrentAdminUser: () => {
    const user = apiUtils.getCurrentUser();
    if (user && user.roles?.includes('ADMIN')) {
      return user;
    }
    return null;
  },

  // Check if current user has admin role
  hasAdminRole: (): boolean => {
    const user = apiUtils.getCurrentUser();
    return !!(user && user.roles?.includes('ADMIN'));
  },

  // Get admin-specific user info
  getAdminUserInfo: async () => {
    try {
      const response = await adminApi.get('/admin/profile');
      console.log('✅ Admin user info retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get admin user info:', error);
      throw error;
    }
  },

  // Admin dashboard data
  getAdminDashboard: async () => {
    try {
      const response = await adminApi.get('/admin/dashboard');
      console.log('✅ Admin dashboard data retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get admin dashboard data:', error);
      throw error;
    }
  },

  // Admin settings
  getAdminSettings: async () => {
    try {
      const response = await adminApi.get('/admin/settings');
      console.log('✅ Admin settings retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get admin settings:', error);
      throw error;
    }
  },

  updateAdminSettings: async (settings: any) => {
    try {
      const response = await adminApi.put('/admin/settings', settings);
      console.log('✅ Admin settings updated');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update admin settings:', error);
      throw error;
    }
  },

  // User management utilities
  getAllUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
      const response = await adminApi.get('/admin/users', { params });
      console.log('✅ All users retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get all users:', error);
      throw error;
    }
  },

  getUserById: async (userId: string | number) => {
    try {
      const response = await adminApi.get(`/admin/users/${userId}`);
      console.log('✅ User details retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get user details:', error);
      throw error;
    }
  },

  updateUser: async (userId: string | number, userData: any) => {
    try {
      const response = await adminApi.put(`/admin/users/${userId}`, userData);
      console.log('✅ User updated');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string | number) => {
    try {
      const response = await adminApi.delete(`/admin/users/${userId}`);
      console.log('✅ User deleted');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
      throw error;
    }
  },

  // System utilities
  getSystemStats: async () => {
    try {
      const response = await adminApi.get('/admin/system/stats');
      console.log('✅ System stats retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get system stats:', error);
      throw error;
    }
  },

  // Validation utilities
  validateAdminPermissions: (requiredPermissions: string[]): boolean => {
    const user = apiUtils.getCurrentUser();
    if (!user || !user.roles?.includes('ADMIN')) {
      return false;
    }

    // Add more specific permission checks if needed
    return true;
  }
};

export default adminApi;