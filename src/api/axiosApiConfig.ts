import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Extend AxiosRequestConfig để thêm _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Instance gốc dùng same-origin.
 * Nginx (ở FE) sẽ proxy /api -> api-gateway:8080/
 * 
 * Configuration được lấy từ environment variables
 */
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  withCredentials: true, // use cookie/session for same-origin
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Utility functions for token management
 */
const TokenManager = {
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
    
    if (token) {
      // Kiểm tra token còn hiệu lực không
      if (!TokenManager.isTokenExpired(token)) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Thêm request ID để track
    config.headers = config.headers ?? {};
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: handle errors globally với refresh token
api.interceptors.response.use(
  (response) => {
    // Log successful responses trong development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    // Log errors
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message
    });

    // Handle 401 Unauthorized với refresh token logic
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = TokenManager.getRefreshToken();
      
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          // Gọi refresh token endpoint
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
            
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Refresh token thất bại - clear storage và redirect
          TokenManager.clearTokens();
          redirectToLogin();
          return Promise.reject(refreshError);
        }
      } else {
        // Không có refresh token hoặc đã expired - redirect login
        TokenManager.clearTokens();
        redirectToLogin();
      }
    }

    // Handle other common errors
    handleCommonErrors(error);

    return Promise.reject(error);
  }
);

/**
 * Common error handling
 */
function handleCommonErrors(error: AxiosError) {
  const status = error.response?.status;
  
  switch (status) {
    case 403:
      console.warn('Access forbidden - insufficient permissions');
      // Có thể show toast/notification
      break;
    case 404:
      console.warn('Resource not found');
      break;
    case 429:
      console.warn('Rate limit exceeded - too many requests');
      break;
    case 500:
      console.error('Internal server error');
      break;
    case 502:
    case 503:
    case 504:
      console.error('Service unavailable - server may be down');
      break;
    default:
      if (status && status >= 500) {
        console.error('Server error occurred');
      }
  }
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  // Tránh infinite redirect loop
  if (window.location.pathname !== '/login') {
    // Store current location để redirect lại sau khi login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
    window.location.href = '/login';
  }
}

/**
 * API utilities
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
        return payload;
      } catch {
        return null;
      }
    }
    return null;
  },
  
  // Manual logout
  logout: () => {
    TokenManager.clearTokens();
    window.location.href = '/login';
  },
  
  // Set authentication tokens (for login success)
  setAuthTokens: (accessToken: string, refreshToken?: string) => {
    TokenManager.setTokens(accessToken, refreshToken);
  }
};

// Export token manager for use in other modules
export { TokenManager };

export default api;