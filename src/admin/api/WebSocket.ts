
import SockJS from 'sockjs-client';
import { CompatClient, Stomp } from '@stomp/stompjs';


export const connectWebSocket = (username: string, onMessage: (msg: any) => void) => {
  const token = sessionStorage.getItem('token');
  console.log("🔐 WebSocket connect as:", username, "Token:", token);

  const socket = new SockJS(`http://localhost:8081/ws?token=${token}`);
  const stompClient: CompatClient = Stomp.over(socket);

  stompClient.connect(
    { Authorization: `Bearer ${token}` },
    () => {
      console.log('✅ STOMP Connected');
      //Subscribe to the private user queue
      stompClient.subscribe('/user/queue/private', (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log('📩 STOMP message received:', data);
          onMessage(data);
        } catch (e) {
          console.error("❌ Failed to parse message", message.body, e);
        }
      });      
    },
    (error: any) => {
      console.error('❌ STOMP connection failed:', error);
    }
  );
};
