import React, { useState } from 'react';
import RoomList from '../components/RoomList';
import ChatBox from '../components/ChatBox';
import '../assets/css/ChatPage.css';

const ChatPage: React.FC = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  return (
    <div className="chat-page" style={{ paddingTop: '120px' }}>
      <div className="chat-sidebar">
        <RoomList selectedRoomId={selectedRoomId} onSelectRoom={setSelectedRoomId} />
      </div>
      <div className="chat-content">
        {selectedRoomId ? (
          <ChatBox roomId={selectedRoomId} />
        ) : (
          <div className="chat-placeholder">🗨️ Chọn phòng để bắt đầu chat</div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
