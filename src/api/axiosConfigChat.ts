import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenManager, apiUtils } from './axiosApiConfig';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Instance cho Chat Service
 * 
 * Routing flow:
 * Frontend: localhost:3000/chat/api/v1/*
 * -> Nginx proxy: /chat/*
 * -> API Gateway: /chat/** (StripPrefix=1) 
 * -> Chat Service: /api/v1/*
 * 
 * Chat service thường cần authentication cho hầu hết endpoints
 */
export const chatApi = axios.create({
  baseURL: '/chat',  // Match với nginx proxy và gateway routing
  withCredentials: true,
  timeout: 30000,  // Chat có thể cần timeout cao hơn cho long polling
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Define public endpoints for chat service (ít endpoints public)
 */
const PUBLIC_CHAT_ENDPOINTS = [
  '/health',
  '/api/v1/public',
  '/chat/ws',
  '/chat/ws/**',
  '/chat/api/v1/guest',
  '/chat/api/v1/guest/**'
];

/**
 * Check if chat endpoint is public
 */
function isPublicChatEndpoint(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_CHAT_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

/**
 * Request interceptor cho Chat API
 */
chatApi.interceptors.request.use(
  (config) => {
    const isPublic = isPublicChatEndpoint(config.url);

    // Add authentication cho non-public endpoints
    if (!isPublic) {
      const token = TokenManager.getAccessToken();
      if (token && !TokenManager.isTokenExpired(token)) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add chat-specific headers
    config.headers = config.headers ?? {};
    config.headers['X-Service'] = 'chat-service';
    config.headers['X-Client-Type'] = 'web';
    config.headers['X-Chat-Client'] = 'react-web';
    config.headers['X-Request-ID'] = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add user context if available
    const currentUser = apiUtils.getCurrentUser();
    if (currentUser && !isPublic) {
      config.headers['X-User-ID'] = currentUser.id;
      if (currentUser.username) {
        config.headers['X-Username'] = currentUser.username;
      }
    }
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`💬 Chat API Request [${config.method?.toUpperCase()}] ${config.url}`, {
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        isPublic,
        hasAuth: !!config.headers.Authorization,
        userId: config.headers['X-User-ID']
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Chat API request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor cho Chat API
 */
chatApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Chat API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
        status: response.status,
        hasData: !!response.data,
        dataType: typeof response.data
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Enhanced error logging cho Chat API
    console.error('❌ Chat API Error:', {
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
        !isPublicChatEndpoint(originalRequest.url)) {
      
      originalRequest._retry = true;
      const refreshToken = TokenManager.getRefreshToken();
      
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          console.log('🔄 Chat API attempting token refresh...');
          
          // Call refresh token endpoint through users service
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
            
            console.log('✅ Chat API token refreshed, retrying request');
            return chatApi(originalRequest);
          }
        } catch (refreshError: any) {
          console.error('❌ Chat API token refresh failed:', refreshError);
          TokenManager.clearTokens();
          redirectToChatLogin('Chat session expired');
          return Promise.reject(refreshError);
        }
      } else {
        console.log('🚫 No valid refresh token for Chat API');
        TokenManager.clearTokens();
        redirectToChatLogin('Authentication required for chat');
      }
    }

    // Handle chat-specific errors
    handleChatErrors(error);
    return Promise.reject(error);
  }
);

/**
 * Handle chat service specific errors
 */
function handleChatErrors(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data as any;
  
  switch (status) {
    case 400:
      if (data?.message?.includes('message')) {
        console.warn('⚠️ Invalid message format or content');
      } else if (data?.message?.includes('room') || data?.message?.includes('conversation')) {
        console.warn('⚠️ Invalid chat room or conversation ID');
      } else {
        console.warn('⚠️ Bad request - check chat data format');
      }
      break;
    case 403:
      console.warn('⚠️ Chat access forbidden - may need to join conversation first');
      break;
    case 404:
      if (error.config?.url?.includes('/conversations/') || error.config?.url?.includes('/rooms/')) {
        console.warn('⚠️ Chat conversation or room not found');
      } else {
        console.warn('⚠️ Chat endpoint not found');
      }
      break;
    case 409:
      console.warn('⚠️ Chat conflict - duplicate message or already joined');
      break;
    case 413:
      console.warn('⚠️ Message too large - reduce message size');
      break;
    case 422:
      console.warn('⚠️ Chat validation error - check message format and required fields');
      break;
    case 429:
      console.warn('⚠️ Chat rate limit exceeded - slow down messaging');
      break;
    case 503:
      console.error('❌ Chat service unavailable - messages may not be delivered');
      break;
    case 507:
      console.error('❌ Chat storage full - unable to save messages');
      break;
    default:
      if (status && status >= 500) {
        console.error('❌ Chat service error - messages may not be delivered');
      }
  }

  // Log specific chat error details
  if (data && (data.message || data.error || data.details)) {
    console.error('📋 Chat API Error Details:', data.message || data.error || data.details);
  }
}

/**
 * Redirect to login với chat context
 */
function redirectToChatLogin(reason?: string) {
  if (window.location.pathname !== '/login') {
    // Store current chat context
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    if (reason) {
      sessionStorage.setItem('loginReason', reason);
      sessionStorage.setItem('loginContext', 'chat');
    }
    
    console.log(`🔄 Chat API redirecting to login: ${reason || 'Authentication required'}`);
    window.location.href = '/login';
  }
}

/**
 * Enhanced Chat Service Utilities
 */
export const chatUtils = {
  // Health check cho chat service
  checkChatHealth: async (): Promise<boolean> => {
    try {
      const response = await chatApi.get('/health', { timeout: 5000 });
      console.log('✅ Chat service health check passed');
      return response.status === 200;
    } catch (error) {
      console.error('❌ Chat service health check failed:', error);
      return false;
    }
  },

  // Test connectivity to chat service
  testConnection: async (): Promise<boolean> => {
    try {
      console.log('🧪 Testing Chat API connection...');
      const response = await chatApi.get('/api/v1/health', { timeout: 5000 });
      console.log('✅ Chat API connection test passed:', response.status);
      return true;
    } catch (error: any) {
      console.error('❌ Chat API connection test failed:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url
      });
      return false;
    }
  },
  
  // Get current chat user info
  getCurrentChatUser: () => {
    const user = apiUtils.getCurrentUser();
    return user ? {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles || [],
      displayName: user.username || user.email?.split('@')[0]
    } : null;
  },
  
  // Format message for API
  formatMessage: (
    content: string, 
    type: 'text' | 'image' | 'file' | 'emoji' = 'text',
    metadata?: any
  ) => {
    const user = chatUtils.getCurrentChatUser();
    return {
      content: content.trim(),
      type,
      timestamp: new Date().toISOString(),
      clientId: `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: user ? {
        id: user.id,
        username: user.username,
        displayName: user.displayName
      } : null,
      metadata: metadata || {}
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
    
    // Check for potentially harmful content (basic check)
    if (content.includes('<script>') || content.includes('javascript:')) {
      return { isValid: false, error: 'Message contains potentially harmful content' };
    }
    
    return { isValid: true };
  },

  // Enhanced conversation management
  createConversation: async (participantIds: string[], title?: string) => {
    try {
      const response = await chatApi.post('/api/v1/conversations', {
        participantIds,
        title: title || `Conversation ${new Date().toLocaleString()}`,
        type: 'group'
      });
      console.log('✅ Conversation created');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create conversation:', error);
      throw error;
    }
  },

  joinConversation: async (conversationId: string) => {
    try {
      const response = await chatApi.post(`/api/v1/conversations/${conversationId}/join`);
      console.log('✅ Joined conversation:', conversationId);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to join conversation:', error);
      throw error;
    }
  },

  leaveConversation: async (conversationId: string) => {
    try {
      const response = await chatApi.post(`/api/v1/conversations/${conversationId}/leave`);
      console.log('✅ Left conversation:', conversationId);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to leave conversation:', error);
      throw error;
    }
  },

  // Message management
  sendMessage: async (conversationId: string, content: string, type: string = 'text') => {
    const validation = chatUtils.validateMessage(content);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const message = chatUtils.formatMessage(content, type as any);
      const response = await chatApi.post(`/api/v1/conversations/${conversationId}/messages`, message);
      console.log('✅ Message sent to conversation:', conversationId);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  },

  getMessages: async (conversationId: string, page: number = 1, limit: number = 50) => {
    try {
      const response = await chatApi.get(`/api/v1/conversations/${conversationId}/messages`, {
        params: { page, limit }
      });
      console.log('✅ Messages retrieved for conversation:', conversationId);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get messages:', error);
      throw error;
    }
  },

  // Real-time connection utilities
  establishWebSocketConnection: (conversationId: string) => {
    const user = chatUtils.getCurrentChatUser();
    if (!user) {
      console.error('❌ Cannot establish WebSocket connection: user not authenticated');
      return null;
    }

    const token = TokenManager.getAccessToken();
    if (!token) {
      console.error('❌ Cannot establish WebSocket connection: no access token');
      return null;
    }

    // WebSocket connection setup would go here
    console.log('🔌 WebSocket connection setup for conversation:', conversationId);
    return {
      conversationId,
      userId: user.id,
      token,
      timestamp: Date.now()
    };
  },

  // Utility functions
  formatTimestamp: (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  },

  generateMessageId: () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Check if user can access chat
  canAccessChat: () => {
    const user = chatUtils.getCurrentChatUser();
    return !!user && apiUtils.isAuthenticated();
  }
};

export default chatApi;