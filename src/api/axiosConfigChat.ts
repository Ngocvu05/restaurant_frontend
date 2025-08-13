import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenManager, apiUtils } from './axiosApiConfig';

// Extend AxiosRequestConfig để thêm _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Instance cho Chat API
 * Sử dụng same-origin pattern như axiosApiConfig
 * Nginx proxy: /api/chat -> api-gateway:8080/chat
 */
export const chatApi = axios.create({
  baseURL: '/api/chat/api/v1',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: set token vào header
chatApi.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    
    if (token && !TokenManager.isTokenExpired(token)) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Thêm request metadata cho chat
    config.headers = config.headers ?? {};
    config.headers['X-Chat-Client'] = 'web';
    config.headers['X-Request-ID'] = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log chat API requests trong development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Chat API Request [${config.method?.toUpperCase()}] ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Chat API request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: handle errors globally với refresh token
chatApi.interceptors.response.use(
  (response) => {
    // Log successful chat responses trong development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Chat API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Log chat API errors
    console.error('Chat API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message
    });

    // Xử lý 401 với refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = TokenManager.getRefreshToken();
      
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          // Gọi refresh token endpoint thông qua users API
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
            // Cập nhật tokens sử dụng TokenManager
            TokenManager.setTokens(newToken, newRefreshToken);

            // Retry original request với token mới
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            return chatApi(originalRequest);
          }
        } catch (refreshError) {
          console.error('Chat API token refresh failed:', refreshError);
          // Refresh token thất bại - clear storage và redirect
          TokenManager.clearTokens();
          redirectToLogin('Chat session expired');
          return Promise.reject(refreshError);
        }
      } else {
        // Không có refresh token hoặc đã expired - redirect login
        TokenManager.clearTokens();
        redirectToLogin('Authentication required for chat');
      }
    }

    // Handle chat-specific errors
    handleChatErrors(error);

    return Promise.reject(error);
  }
);

/**
 * Handle chat-specific errors
 */
function handleChatErrors(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data as any;
  
  switch (status) {
    case 403:
      console.warn('Chat access forbidden - may need to join conversation first');
      break;
    case 404:
      console.warn('Chat conversation not found');
      break;
    case 429:
      console.warn('Chat rate limit exceeded - slow down messaging');
      // Có thể show notification cho user
      break;
    case 413:
      console.warn('Message too large');
      break;
    default:
      if (status && status >= 500) {
        console.error('Chat service error - messages may not be delivered');
      }
  }

  // Log specific chat error details
  if (data && data.message) {
    console.error('Chat API Error Details:', data.message);
  }
}

/**
 * Redirect to login with chat context
 */
function redirectToLogin(reason?: string) {
  if (window.location.pathname !== '/login') {
    // Store current chat context
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    if (reason) {
      sessionStorage.setItem('loginReason', reason);
    }
    
    window.location.href = '/login';
  }
}

/**
 * Chat-specific utilities
 */
export const chatUtils = {
  // Check if chat service is available
  checkChatHealth: async () => {
    try {
      const response = await chatApi.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },
  
  // Get current chat user info
  getCurrentChatUser: () => {
    const user = apiUtils.getCurrentUser();
    return user ? {
      id: user.sub || user.userId,
      username: user.username || user.preferred_username,
      email: user.email,
      roles: user.roles || []
    } : null;
  },
  
  // Format chat message for API
  formatMessage: (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    return {
      content: content.trim(),
      type,
      timestamp: new Date().toISOString(),
      clientId: `web_${Date.now()}`
    };
  },
  
  // Validate message before sending
  validateMessage: (content: string): { isValid: boolean; error?: string } => {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    
    if (content.length > 5000) {
      return { isValid: false, error: 'Message too long (max 5000 characters)' };
    }
    
    return { isValid: true };
  }
};

export default chatApi;