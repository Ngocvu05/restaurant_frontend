import axiosConfig from '../../api/axiosConfigChat';
import { ChatMessageRequest } from '../../api/chatApi'; // Tái sử dụng interface từ file chatApi

/**
 * Lấy ID của admin từ sessionStorage.
 * @returns {string | null}
 */
const getAdminId = (): string | null => {
  return sessionStorage.getItem('userId');
};

export const adminChatApi = {
  /**
   * API để admin lấy tất cả các phòng chat của khách hàng.
   * Yêu cầu backend cần có endpoint này, ví dụ: GET /chat/api/v1/admin/chat/rooms/all
   */
  getAllCustomerRooms: () => {
    // Endpoint này là giả định, bạn cần đảm bảo nó tồn tại ở backend
    return axiosConfig.get('/admin/chat/rooms/all');
  },

  /**
   * API để admin tham gia vào một phòng chat cụ thể.
   * Tương ứng với endpoint: POST /api/v1/admin/chat/join/{roomId}
   * @param {string} roomId - ID của phòng chat cần tham gia.
   */
  joinRoom: (roomId: string) => {
    const adminId = getAdminId();
    if (!adminId) {
      return Promise.reject(new Error('Admin ID not found in sessionStorage.'));
    }
    
    return axiosConfig.post(
      `/admin/chat/join/${roomId}`, 
      {}, // Không cần body
      {
        headers: {
          'X-User-Id': adminId,
        },
      }
    );
  },

  getMessagesByChatRoom: (roomId: string, page: number, size = 10) => {
    const adminId = getAdminId();
    if (!adminId) {
      return Promise.reject(new Error('Admin ID not found in sessionStorage.'));
    }
    
    return axiosConfig.get(
      `/chat/${roomId}?page=${page}&size=${size}`, 
      {}, // Không cần body
    );
  },


  /**
   * API để admin gửi tin nhắn cho khách hàng.
   * Sử dụng endpoint chung nhưng với senderType là 'ADMIN'.
   * @param {Omit<ChatMessageRequest, 'senderType'>} data - Dữ liệu tin nhắn.
   */
  sendMessage: (data: ChatMessageRequest) => {
    const adminId = getAdminId();
    if (!adminId) {
      return Promise.reject(new Error('Admin ID not found in sessionStorage.'));
    }

    // Đảm bảo các thông tin của admin là chính xác trước khi gửi
    const payload: ChatMessageRequest = {
      ...data,
      userId: Number(adminId),
      senderType: 'ADMIN', // Quan trọng: Đánh dấu tin nhắn này từ Admin
    };

    return axiosConfig.post('/admin/chat/send', payload);
  },

  /**
   * API để admin đánh dấu một phòng chat là đã xử lý xong (đóng phòng).
   * Tương ứng với endpoint: PUT /api/v1/admin/chat/resolve/{roomId}
   * @param {string} roomId - ID của phòng chat cần đóng.
   */
  resolveRoom: (roomId: string) => {
    const adminId = getAdminId();
    if (!adminId) {
      return Promise.reject(new Error('Admin ID not found in sessionStorage.'));
    }

    return axiosConfig.put(
      `/admin/chat/resolve/${roomId}`, 
      {}, // Không cần body
      {
        headers: {
          'X-User-Id': adminId,
        },
      }
    );
  },
};