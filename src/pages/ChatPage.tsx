// src/pages/ChatPage.tsx
import React, { useEffect, useState } from 'react';
import { chatApi } from '../api/chatApi';
import RoomList from '../components/RoomList';
import ChatBox from '../components/ChatBox';
import '../assets/css/ChatPage.css'; // bạn có thể tùy chỉnh sau

const ChatPage: React.FC = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  return (
    <div className="chat-page">
      <RoomList onSelectRoom={setSelectedRoomId} selectedRoomId={selectedRoomId} />
      {selectedRoomId ? (
        <ChatBox roomId={selectedRoomId} />
      ) : (
        <div className="chat-placeholder">🗨️ Hãy chọn một phòng chat để bắt đầu</div>
      )}
    </div>
  );
};

export default ChatPage;
