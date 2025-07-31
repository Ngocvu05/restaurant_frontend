import React, { useEffect, useState, createContext, useContext } from 'react';
import RoomList from '../components/RoomList';
import ChatBox from '../components/ChatBox';
import { ChatMessageDTO } from '../api/chatApi';
import { chatApi } from '../api/chatApi';
import '../assets/css/Chat.css';

// Theme Context
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

const ChatPage: React.FC = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  useEffect(() => {
    document.body.className = isDark ? 'dark-theme' : '';
  }, [isDark]);

  const handleSelectRoom = async (sessionId: string) => {
    setSelectedRoomId(sessionId);
    const res = await chatApi.getMessages(sessionId, 0);
    const raw = Array.isArray(res.data?.content) ? res.data.content : res.data;
    setMessages(raw.reverse());
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={`chat-page ${isDark ? 'dark' : ''}`} style={{ paddingTop: '80px' }}>
        <div className="chat-sidebar">
          <RoomList selectedRoomId={selectedRoomId} onSelectRoom={handleSelectRoom} />
        </div>
        <div className="chat-main" style={{ paddingTop: '40px' }}>
          {selectedRoomId ? (
            <ChatBox sessionId={selectedRoomId} initialMessages={messages} />
          ) : (
            <div className="chat-placeholder">
              🗨️ Chọn phòng để bắt đầu chat
              <button className="theme-toggle" onClick={toggleTheme}>
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          )}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export default ChatPage;