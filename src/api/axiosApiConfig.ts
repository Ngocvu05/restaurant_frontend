import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Extend AxiosRequestConfig để thêm _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Common API instance cho tất cả services
 * Frontend (port 3000) -> nginx proxy -> api-gateway (port 8080)
 * 
 * API Gateway routes:
 * - /users/** -> user-service (với StripPrefix=1)
 * - /search/** -> search-service (với StripPrefix=1)  
 * - /chat/** -> chat-service (với StripPrefix=1)
 */
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Enhanced Token Management Utilities
 */
export const TokenManager = {
  getAccessToken: () => {
    // Ưu tiên sessionStorage, fallback localStorage
    return sessionStorage.getItem('token') || localStorage.getItem('access_token');
  },
  
  getRefreshToken: () => {
    return sessionStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
  },
  
  setTokens: (accessToken: string, refreshToken?: string) => {
    sessionStorage.setItem('token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('refreshToken', refreshToken);
    }
    // Backwards compatibility
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  },
  
  clearTokens: () => {
    sessionStorage.clear();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
};

// Request interceptor: set token vào header và validate token
api.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    
    if (token && !TokenManager.isTokenExpired(token)) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Thêm request metadata
    config.headers = config.headers ?? {};
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    config.headers['X-Client-Type'] = 'web';
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request [${config.method?.toUpperCase()}] ${config.url}`, {
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasAuth: !!config.headers.Authorization
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: handle errors globally với refresh token
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, 
        response.status, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    // Enhanced error logging
    console.error('❌ API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data
    });

    // Handle 401 Unauthorized với refresh token logic
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Skip refresh token cho auth endpoints để tránh infinite loop
      const isAuthEndpoint = originalRequest.url?.includes('/auth/');
      if (isAuthEndpoint) {
        console.log('🚫 Skip token refresh for auth endpoint');
        TokenManager.clearTokens();
        redirectToLogin('Authentication failed');
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = TokenManager.getRefreshToken();
      
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          console.log('🔄 Attempting token refresh...');
          
          // Call refresh token endpoint through users service
          const refreshResponse = await axios.post('/users/api/v1/auth/refresh-token', {
            refreshToken: refreshToken
          }, {
            baseURL: process.env.REACT_APP_API_BASE_URL || '/',
            withCredentials: true,
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data;

          if (newToken) {
            TokenManager.setTokens(newToken, newRefreshToken);
            
            // Retry original request với token mới
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            console.log('✅ Token refreshed successfully, retrying request');
            return api(originalRequest);
          }
        } catch (refreshError: any) {
          console.error('❌ Token refresh failed:', refreshError);
          TokenManager.clearTokens();
          redirectToLogin('Session expired');
          return Promise.reject(refreshError);
        }
      } else {
        console.log('🚫 No valid refresh token available');
        TokenManager.clearTokens();
        redirectToLogin('Authentication required');
      }
    }

    // Handle other common errors
    handleCommonErrors(error);
    return Promise.reject(error);
  }
);

/**
 * Enhanced common error handling
 */
function handleCommonErrors(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data as any;
  
  switch (status) {
    case 400:
      console.warn('⚠️ Bad Request - Invalid input data');
      break;
    case 403:
      console.warn('⚠️ Access forbidden - Insufficient permissions');
      break;
    case 404:
      console.warn('⚠️ Resource not found');
      break;
    case 408:
      console.warn('⚠️ Request timeout - Server took too long to respond');
      break;
    case 422:
      console.warn('⚠️ Validation error - Check required fields');
      break;
    case 429:
      console.warn('⚠️ Rate limit exceeded - Too many requests');
      break;
    case 500:
      console.error('❌ Internal server error');
      break;
    case 502:
      console.error('❌ Bad Gateway - API Gateway error');
      break;
    case 503:
      console.error('❌ Service unavailable - Backend service may be down');
      break;
    case 504:
      console.error('❌ Gateway timeout - Backend service not responding');
      break;
    default:
      if (status && status >= 500) {
        console.error('❌ Server error occurred');
      }
  }

  // Log specific error details
  if (data && (data.message || data.error)) {
    console.error('📋 Error Details:', data.message || data.error);
  }
}

/**
 * Enhanced redirect to login
 */
function redirectToLogin(reason?: string) {
  if (window.location.pathname !== '/login') {
    // Store current location để redirect lại sau khi login
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    if (reason) {
      sessionStorage.setItem('loginReason', reason);
      console.log(`🔄 Redirecting to login: ${reason}`);
    }
    
    window.location.href = '/login';
  }
}

/**
 * Enhanced API utilities
 */
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = TokenManager.getAccessToken();
    return token && !TokenManager.isTokenExpired(token);
  },
  
  // Get current user info from token
  getCurrentUser: () => {
    const token = TokenManager.getAccessToken();
    if (token && !TokenManager.isTokenExpired(token)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          id: payload.sub || payload.userId,
          email: payload.email,
          username: payload.username || payload.preferred_username,
          roles: payload.roles || [],
          exp: payload.exp,
          iat: payload.iat
        };
      } catch (error) {
        console.error('❌ Failed to parse token:', error);
        return null;
      }
    }
    return null;
  },
  
  // Manual logout
  logout: () => {
    TokenManager.clearTokens();
    console.log('🚪 User logged out');
    window.location.href = '/login';
  },
  
  // Set authentication tokens (for login success)
  setAuthTokens: (accessToken: string, refreshToken?: string) => {
    TokenManager.setTokens(accessToken, refreshToken);
    console.log('🔐 Authentication tokens updated');
  },
  
  // API health check
  checkAPIHealth: async () => {
    try {
      // Check API Gateway health through users service
      const response = await api.get('/users/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('❌ API health check failed:', error);
      return false;
    }
  },
  
  // Get API base info
  getAPIInfo: () => {
    return {
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      environment: process.env.NODE_ENV,
      isAuthenticated: apiUtils.isAuthenticated()
    };
  }
};

export default api;