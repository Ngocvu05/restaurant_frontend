import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { MessageCircle, X } from 'lucide-react';
import '../assets/css/FloatingChatWidget.css';

interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
}

const FloatingChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const stompClient = useRef<Client | null>(null);
  const sessionId = useRef<string>(`chat-${Date.now()}`);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const socket = new SockJS('http://localhost:8083/ws'); // 👈 DIRECT to chat-service
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log('✅ Connected to WebSocket');
        client.subscribe(`/topic/room/${sessionId.current}`, (message: IMessage) => {
          const body = JSON.parse(message.body);
          setMessages((prev) => [...prev, { sender: 'ai', content: body.response || body.content }]);
        });
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const token = sessionStorage.getItem('token');
    const userId = token ? Number(sessionStorage.getItem('userId')) : undefined;

    const payload = {
      chatRoomId: sessionId.current,
      sessionId: sessionId.current,
      userId,
      message: input,
      senderType: 'USER',
    };

    if (token) {
      // 🔐 Gửi qua REST nếu đã login
      try {
        await fetch('http://localhost:8080/chat/api/v1/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error('❌ REST gửi tin nhắn lỗi:', error);
      }
    } else {
      // 🟢 Gửi qua WebSocket nếu chưa login
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.publish({
          destination: '/app/chat.send',
          body: JSON.stringify(payload),
        });
      }
    }

    setMessages((prev) => [...prev, { sender: 'user', content: input }]);
    setInput('');
  };

  return (
    <div className="floating-chat-wrapper">
      {!open && (
        <div className="floating-chat-icon" onClick={() => setOpen(true)}>
          <MessageCircle size={28} />
        </div>
      )}
      {open && (
        <div className="floating-chat-box">
          <div className="chat-header">
            <span>💬 Chat với AI</span>
            <X className="chat-close" onClick={() => setOpen(false)} />
          </div>
          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.sender}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Nhập tin nhắn..."
            />
            <button onClick={sendMessage}>Gửi</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChatWidget;
