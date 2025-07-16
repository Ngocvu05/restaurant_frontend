import { useEffect, useRef } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface Notification {
  message: string;
  createdAt: string;
}

type OnMessage = (notification: Notification) => void;

export const useNotificationSocket = (onMessage: OnMessage) => {
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return;

    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`, // 👈 Gửi token
      },
      debug: (str) => console.log('[STOMP]', str),
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      console.log('✅ Connected to WebSocket');
      const sub = stompClient.subscribe('/user/queue/private', (msg: IMessage) => {
        try {
          const data: Notification = JSON.parse(msg.body);
          onMessage(data);
        } catch (err) {
          console.error('Lỗi xử lý thông báo:', err);
        }
      });
      subscriptionRef.current = sub;
    };

    stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      subscriptionRef.current?.unsubscribe();
      stompClientRef.current?.deactivate();
    };
  }, [onMessage]);
};
