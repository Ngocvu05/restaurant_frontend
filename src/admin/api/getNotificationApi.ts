import { adminApi } from './axiosApiConfigAdmin';

export interface Notification {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  userId?: number;
  metadata?: any;
}

export interface NotificationPageResponse {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface NotificationQueryParams {
  limit?: number;
  page?: number;
  size?: number;
  type?: string;
  isRead?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Enhanced Notification API với proper response handling
 */
export const getNotificationApi = {
  /**
   * Get all notifications với pagination
   */
  getAll: async (params: NotificationQueryParams = {}): Promise<NotificationPageResponse> => {
    try {
      console.log('📬 Fetching all notifications with params:', params);
      const response = await adminApi.get('/admin/notifications/', { params });
      console.log('✅ All notifications retrieved successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch all notifications:', error);
      throw new Error(`Failed to fetch notifications: ${error.response?.data?.message || error.message}`);
    }
  },

  /**
   * Get limited number of notifications (for quick previews)
   */
  getLimited: async (limit: number = 10): Promise<Notification[]> => {
    try {
      console.log(`📬 Fetching ${limit} latest notifications`);
      const response = await adminApi.get(`/admin/notifications/?limit=${limit}`);
      console.log('✅ Limited notifications retrieved successfully');
      
      // Handle response format - check if it's paginated response or direct array
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.content)) {
          return response.data.content;
        } else if (Array.isArray(response.data)) {
          return response.data;
        } else {
          console.warn('⚠️ Unexpected notification response format:', response.data);
          return [];
        }
      } else {
        console.warn('⚠️ Invalid notification response:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch limited notifications:', error);
      throw new Error(`Failed to fetch limited notifications: ${error.response?.data?.message || error.message}`);
    }
  },

  /**
   * Get notification by ID
   */
  getById: async (id: number): Promise<Notification> => {
    try {
      console.log(`📬 Fetching notification with ID: ${id}`);
      const response = await adminApi.get(`/admin/notifications/${id}`);
      console.log('✅ Notification retrieved successfully');
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to fetch notification ${id}:`, error);
      throw new Error(`Failed to fetch notification: ${error.response?.data?.message || error.message}`);
    }
  },

  /**
   * Mark notification as read
   */
  readNotification: async (id: number): Promise<void> => {
    try {
      console.log(`📖 Marking notification ${id} as read`);
      const response = await adminApi.put(`/admin/notifications/${id}/mark-read`);
      console.log('✅ Notification marked as read successfully');
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to mark notification ${id} as read:`, error);
      throw new Error(`Failed to mark notification as read: ${error.response?.data?.message || error.message}`);
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      console.log('📖 Marking all notifications as read');
      const response = await adminApi.put('/admin/notifications/mark-all-read');
      console.log('✅ All notifications marked as read successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw new Error(`Failed to mark all notifications as read: ${error.response?.data?.message || error.message}`);
    }
  },

  /**
   * Create test notification
   */
  createTestNotification: async (username: string, title: string, message: string): Promise<void> => {
    try {
      console.log(`🧪 Creating test notification for ${username}`);
      const response = await adminApi.post('/admin/notifications/test', null, {
        params: { username, title, message }
      });
      console.log('✅ Test notification created successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create test notification:', error);
      throw new Error(`Failed to create test notification: ${error.response?.data?.message || error.message}`);
    }
  },

  /**
   * Send broadcast notification
   */
  sendBroadcast: async (message: string): Promise<void> => {
    try {
      console.log('📢 Sending broadcast notification');
      const response = await adminApi.post('/admin/notifications/notify/broadcast', message, {
        headers: { 'Content-Type': 'text/plain' }
      });
      console.log('✅ Broadcast notification sent successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send broadcast notification:', error);
      throw new Error(`Failed to send broadcast notification: ${error.response?.data?.message || error.message}`);
    }
  },

  /**
   * Send private notification to user
   */
  sendPrivateNotification: async (username: string, message: string): Promise<void> => {
    try {
      console.log(`📨 Sending private notification to ${username}`);
      const response = await adminApi.post(`/admin/notifications/notify/private/${username}`, message, {
        headers: { 'Content-Type': 'text/plain' }
      });
      console.log(`✅ Private notification sent to ${username} successfully`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to send private notification to ${username}:`, error);
      throw new Error(`Failed to send private notification: ${error.response?.data?.message || error.message}`);
    }
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      console.log('📊 Fetching unread notifications count');
      const notifications = await getNotificationApi.getLimited(100);
      const unreadCount = notifications.filter(n => !n.isRead).length;
      console.log(`✅ Unread count: ${unreadCount}`);
      return unreadCount;
    } catch (error: any) {
      console.error('❌ Failed to fetch unread count:', error);
      return 0;
    }
  },

  /**
   * Debug and testing utilities
   */
  debug: {
    /**
     * Test API connection
     */
    testConnection: async (): Promise<boolean> => {
      try {
        console.log('🧪 Testing notification API connection...');
        await adminApi.get('/admin/notifications/?limit=1');
        console.log('✅ Notification API connection successful');
        return true;
      } catch (error: any) {
        console.error('❌ Notification API connection failed:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        return false;
      }
    },

    /**
     * Check authentication
     */
    checkAuth: async (): Promise<boolean> => {
      try {
        console.log('🔐 Checking notification API authentication...');
        await adminApi.get('/admin/notifications/?limit=1');
        console.log('✅ Authentication successful');
        return true;
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.error('❌ Authentication failed - invalid or expired token');
        } else if (error.response?.status === 403) {
          console.error('❌ Authorization failed - insufficient permissions');
        } else {
          console.error('❌ Auth check failed:', error.message);
        }
        return false;
      }
    },

    /**
     * Log current user info from token
     */
    logCurrentUser: () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('accessToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('👤 Current user info:', {
            username: payload.sub || payload.username,
            roles: payload.roles || payload.authorities,
            exp: payload.exp,
            iat: payload.iat,
            isExpired: Date.now() >= payload.exp * 1000
          });
        } else {
          console.log('❌ No access token found');
        }
      } catch (error) {
        console.error('❌ Failed to decode token:', error);
      }
    },

    /**
     * Test all notification endpoints
     */
    testAllEndpoints: async () => {
      console.log('🧪 Testing all notification endpoints...');
      
      const results = {
        connection: false,
        auth: false,
        getLimited: false,
        getAll: false,
        unreadCount: false
      };

      try {
        results.connection = await getNotificationApi.debug.testConnection();
        results.auth = await getNotificationApi.debug.checkAuth();
        
        if (results.auth) {
          try {
            await getNotificationApi.getLimited(1);
            results.getLimited = true;
            console.log('✅ getLimited test passed');
          } catch (e) {
            console.log('❌ getLimited test failed');
          }
          
          try {
            await getNotificationApi.getAll({ page: 0, size: 1 });
            results.getAll = true;
            console.log('✅ getAll test passed');
          } catch (e) {
            console.log('❌ getAll test failed');
          }

          try {
            await getNotificationApi.getUnreadCount();
            results.unreadCount = true;
            console.log('✅ getUnreadCount test passed');
          } catch (e) {
            console.log('❌ getUnreadCount test failed');
          }
        }
      } catch (error) {
        console.error('❌ Endpoint testing failed:', error);
      }

      console.log('📊 Test Results:', results);
      return results;
    }
  },

  /**
   * Utility functions for formatting and validation
   */
  utils: {
    /**
     * Format notification date for display
     */
    formatDate: (dateString: string): string => {
      try {
        return new Date(dateString).toLocaleString('vi-VN');
      } catch {
        return 'Invalid date';
      }
    },

    /**
     * Get relative time (e.g., "2 hours ago")
     */
    getRelativeTime: (dateString: string): string => {
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} ngày trước`;
        
        return date.toLocaleDateString('vi-VN');
      } catch {
        return 'Invalid date';
      }
    },

    /**
     * Truncate content for preview
     */
    truncateContent: (content: string, maxLength: number = 50): string => {
      if (!content) return '';
      return content.length > maxLength 
        ? content.substring(0, maxLength) + '...' 
        : content;
    },

    /**
     * Validate notification object
     */
    isValidNotification: (notification: any): notification is Notification => {
      return notification &&
             typeof notification.id === 'number' &&
             typeof notification.title === 'string' &&
             typeof notification.content === 'string' &&
             typeof notification.isRead === 'boolean' &&
             typeof notification.createdAt === 'string';
    }
  }
};

export default getNotificationApi;