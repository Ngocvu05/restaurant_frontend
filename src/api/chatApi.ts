import axiosConfig from './axiosConfigChat';

export interface ChatMessageRequest {
  chatRoomId: string;
  sessionId: string;
  userId?: number;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number
  senderType: 'USER' | 'ASSISTANT' | 'GUEST' | 'ADMIN'; // Thêm ADMIN để phân biệt tin nhắn từ admin
}

export interface ChatMessageResponse {
  content: string;
  senderType: 'USER' | 'ASSISTANT';
}

export interface ChatMessageDTO {
  senderType: 'USER' | 'AI' | 'GUEST' | 'ADMIN';
  content: string;
  timestamp: string;
  createdAt: string;
  messageStatus: 'SENT' | 'RECEIVED' | 'READ';
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  senderName?: string;
  isRead: boolean;
  response?: string;
}

export interface ChatRoomDTO {
  id: string;
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  lastMessage: string;
}

export const chatApi = {
  sendMessage: (data: ChatMessageRequest) => {
    const userId = sessionStorage.getItem('userId');
    const token = sessionStorage.getItem('token');
    data.userId = userId ? Number(userId) : undefined;
    // If no user ID or token, this is a guest user
    if (!userId || !token) {
      data.senderType = 'GUEST';
      return axiosConfig.post('/guest/send', data);
    } else {
      return axiosConfig.post('/chat/send', data);
    }
  },

  getMessagesByUserId: (userId: number) => {
    return axiosConfig.get(`/chat/${userId}`);
  },

  getMessages: (roomId: string, page: number, size = 10) => {
    return axiosConfig.get(`/chat/${roomId}?page=${page}&size=${size}`);
  },

  getListRooms: () => axiosConfig.get('/rooms'),

  getMessagesByChatRoom: (roomId: string, page: number, size = 10) =>
    axiosConfig.get(`/messages/${roomId}?page=${page}&size=${size}`),

  getUserRooms: (userId: number) => axiosConfig.get(`/rooms/${userId}`),

  getUserRooms_v2: () => {
    const userId = sessionStorage.getItem('userId');
    return axiosConfig.get('/rooms/me', {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    });
  },
};

export const fetchMessage = () => {
  const userId = sessionStorage.getItem('userId');
  return axiosConfig.get('/history', {
    headers: {
      'X-User-Id': userId || '',
    },
  });
};