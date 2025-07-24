import React, { useState } from 'react';
import RoomList from '../components/RoomList';
import ChatBox from '../components/ChatBox';
import { ChatMessageDTO } from '../api/chatApi';
import { chatApi } from '../api/chatApi';
import '../assets/css/ChatPage.css';

const ChatPage: React.FC = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);

  const handleSelectRoom = async (roomId: string) => {
    setSelectedRoomId(roomId);
    const res = await chatApi.getMessages(roomId, 0);
    const raw = Array.isArray(res.data?.content) ? res.data.content : res.data;
    setMessages(raw.reverse());
  };

  return (
    <div className="chat-page"  style={{ paddingTop: '120px' }}>
      <div className="chat-sidebar">
        <RoomList selectedRoomId={selectedRoomId} onSelectRoom={handleSelectRoom} />
      </div>
      <div className="chat-content" style={{ paddingTop: '120px' }}>
        {selectedRoomId ? (
          <ChatBox roomId={selectedRoomId} messages={messages} />
        ) : (
          <div className="chat-placeholder">🗨️ Chọn phòng để bắt đầu chat</div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;