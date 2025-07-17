// src/api/chatApi.ts
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

export const chatApi = {
  sendMessage: (data: ChatMessageRequest) => {
    return axiosConfig.post('/chat/send', data);
  },

  getMessagesByRoomId: (roomId: string) => {
    return axiosConfig.get(`/messages/${roomId}`);
  },

  getMessages: (roomId: string, page: number, size = 10) => {
    return axiosConfig.get(`/chat/api/v1/messages/${roomId}?page=${page}&size=${size}`);
  },
};
