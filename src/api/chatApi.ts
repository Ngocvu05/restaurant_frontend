import axiosConfig from './axiosConfigChat';

export interface ChatMessageRequest {
  chatRoomId: string;
  sessionId: string;
  userId: number | string;
  message: string;
  senderType: 'USER' | 'ASSISTANT';
}

export interface ChatMessageResponse {
  content: string;
  senderType: 'USER' | 'ASSISTANT';
}

export interface ChatMessageDTO {
  senderType: 'USER' | 'AI';
  content: string;
  timestamp: string;
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
    return axiosConfig.post('/chat/send', data);
  },

  getMessagesByUserId: (userId: number) => {
    return axiosConfig.get(`/chat/${userId}`);
  },

  getMessages: (roomId: string, page: number, size = 10) => {
    return axiosConfig.get(`/chat/${roomId}?page=${page}&size=${size}`);
  },

  getListRooms: () => 
    axiosConfig.get<ChatRoomDTO[]>('/rooms'),

  getMessagesByChatRoom: (roomId: string, page: number, size = 10) =>
    axiosConfig.get<ChatMessageDTO[]>(`/messages/${roomId}?page=${page}&size=${size}`),

  getUserRooms: (userId: number) => axiosConfig.get(`/rooms/${userId}`),

   getUserRooms_v2: () => {
    const userId = sessionStorage.getItem('userId');
    return axiosConfig.get('/rooms/me', {
      headers: {
        "Content-Type": "application/json",
        'X-User-Id': userId,
      },
    });
  },
};
