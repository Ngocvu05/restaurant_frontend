import React, { useEffect, useRef, useState, UIEvent } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { MessageCircle, X } from 'lucide-react';
import { chatApi } from '../api/chatApi';
import '../assets/css/FloatingChatWidget.css';

interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  typing?: boolean;
}

const FloatingChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const stompClient = useRef<Client | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const getSessionId = () => {
    const saved = sessionStorage.getItem('chat-session-id');
    if (saved) return saved;
    const newId = `chat-${Date.now()}`;
    sessionStorage.setItem('chat-session-id', newId);
    return newId;
  };
  const sessionId = useRef<string>(getSessionId());


  // Restore chat messages from sessionStorage when component mounts
  useEffect(() => {
    const saved = sessionStorage.getItem('chatMessages');
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // Delete chat messages on page unload
  useEffect(() => {
    const handleUnload = () => {
      sessionStorage.removeItem('chatMessages');
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const fetchMessages = async (nextPage: number) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const userId = sessionStorage.getItem('userId');

      if (!token || !userId) return;

      const res = await chatApi.getMessages(sessionId.current, nextPage);
      console.log('📦 API trả về:', res.data); // DEBUG

      const raw = res.data?.content ?? [];
      if (raw.length === 0) {
        setHasMore(false);
      } else {
        const formatted = raw.map((m: any) => ({
          sender: m.senderType?.toLowerCase() || 'ai',
          content: m.content,
          timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages((prev) => [...formatted.reverse(), ...prev]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('❌ Lỗi khi tải message:', err);
    } finally {
      setLoading(false);
    }
  };


  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop < 50 && hasMore && !loading) {
      fetchMessages(page + 1);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    const token = sessionStorage.getItem('token');
    // Restore messages from sessionStorage
    const saved = sessionStorage.getItem('chatMessages');
    if (saved) {
      setMessages(JSON.parse(saved));
    }

    if (token) {
      await fetchMessages(0);
    }

    // Scroll to bottom after opening chat
    setTimeout(() => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    const setupWebSocket = async () => {
      const token = sessionStorage.getItem('token');
      const socket = new SockJS('http://localhost:8083/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 3000,
        debug: (str) => console.log(str),
        onConnect: () => {
          console.log('✅ Connected to WebSocket');
          client.subscribe(`/topic/room/${sessionId.current}`, (message: IMessage) => {
            const body = JSON.parse(message.body);
            const response = body.response || body.content;

            setMessages((prev) => {
              const updated: ChatMessage[] = [
                ...prev.filter((m) => !m.typing),
                {
                  sender: 'ai',
                  content: response,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ];
              sessionStorage.setItem('chatMessages', JSON.stringify(updated));
              return updated;
            });
          });
        },
        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame);
        },
      });
      
      client.activate();
      stompClient.current = client;
    };

    setupWebSocket();

    return () => {
      stompClient.current?.deactivate();
    };
  }, []);


  const sendMessage = async () => {
    if (!input.trim()) return;

    const token = sessionStorage.getItem('token');
    const userId = token ? Number(sessionStorage.getItem('userId')) : undefined;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => {
      const updated: ChatMessage[] = [...prev, { sender: 'user', content: input, timestamp }];
      sessionStorage.setItem('chatMessages', JSON.stringify(updated));
      return updated;
    });

    // Show typing indicator
    setMessages((prev) => {
      const updated: ChatMessage[] = [...prev, { sender: 'ai', content: 'AI đang phản hồi...', timestamp: '', typing: true }];
      sessionStorage.setItem('chatMessages', JSON.stringify(updated));
      return updated;
    });

    const payload = {
      chatRoomId: sessionId.current,
      sessionId: sessionId.current,
      userId,
      message: input,
      senderType: 'USER',
    };

    if (token) {
      await fetch('http://localhost:8080/chat/api/v1/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } else {
      stompClient.current?.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload),
      });
    }
    setInput('');
  };

  return (
    <div className="floating-chat-wrapper">
      {!open && (
        <div className="floating-chat-icon" onClick={handleOpen}>
          <MessageCircle size={28} />
        </div>
      )}
      {open && (
        <div className="floating-chat-box">
          <div className="chat-header">
            <span>💬 Chat với AI</span>
            <div className="chat-header-buttons">
              <button className="chat-button" onClick={() => setOpen(false)}>—</button>
              <button className="chat-button" onClick={() => window.location.href = '/chat'}>⬈</button>
            </div>
          </div>
          <div className="chat-body" ref={chatBodyRef} onScroll={onScroll}>
            {loading && <div className="chat-loading">⏳ Đang tải...</div>}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.sender}`}>
                <div className="avatar">{msg.sender === 'ai' ? '🤖' : '🧑'}</div>
                <div className="bubble">{msg.content}</div>
                {!msg.typing && <div className="timestamp">{msg.timestamp}</div>}
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
