// src/components/ChatBox.tsx
import React, { useEffect, useRef, useState, UIEvent } from 'react';
import { chatApi } from '../api/chatApi';

interface Props {
  roomId: string;
}

const ChatBox: React.FC<Props> = ({ roomId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (pageNum = 0) => {
    try {
      setLoading(true);
      const res = await chatApi.getMessages(roomId, pageNum);
      const data = res.data || [];

      if (data.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => [...data.reverse(), ...prev]);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('❌ Lỗi khi tải messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMessages([]);
    setPage(0);
    setHasMore(true);
    fetchMessages(0);
  }, [roomId]);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop < 50 && hasMore && !loading) {
      fetchMessages(page + 1);
    }
  };

  const handleSend = async () => {
    const token = sessionStorage.getItem('token');
    const userIdRaw = sessionStorage.getItem('userId');
    if (!token || !userIdRaw) return;
    const userId = Number(userIdRaw);
    const payload = {
      chatRoomId: roomId,
      sessionId: roomId,
      userId,
      message: input,
      senderType: 'USER' as 'USER' | 'ASSISTANT',
    };

    try {
      await chatApi.sendMessage(payload); // Send message to API
      console.log('📤 Tin nhắn đã gửi:', payload);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'user',
          content: input,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setInput('');
    } catch (err) {
      console.error('❌ Lỗi gửi tin nhắn:', err);
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-history" onScroll={onScroll} ref={chatRef}>
        {loading && <div className="chat-loading">⏳ Đang tải...</div>}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.sender.toLowerCase()}`}>
            <div className="bubble">{msg.content}</div>
            <div className="timestamp">{msg.timestamp}</div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={handleSend}>Gửi</button>
      </div>
    </div>
  );
};

export default ChatBox;