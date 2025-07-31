// RoomList.tsx - Enhanced version
import React, { useEffect, useState } from 'react';
import { chatApi } from '../api/chatApi';
import { useTheme } from '../pages/ChatPage';
import '../assets/css/Chat.css'

interface Props {
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

interface LastMessage {
  id: number;
  roomId: string;
  sessionId: string | null;
  senderId: number;
  senderName: string;
  content?: string;
}

interface Room {
  id: number;
  roomId: string;
  sessionId: string;
  roomName: string;
  roomType: 'PRIVATE' | 'AI_SUPPORT' | 'GROUP';
  description?: string;
  isActive: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  lastMessage?: LastMessage;
  unreadCount: number;
  isTyping?: boolean;
}

const RoomList: React.FC<Props> = ({ selectedRoomId, onSelectRoom }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isDark, toggleTheme } = useTheme();
  const userId = Number(sessionStorage.getItem('userId'));
  const avatarUrl = sessionStorage.getItem('avatar') || './assets/images/avatar.png';

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await chatApi.getUserRooms(userId);
        console.log("userId = ", userId, "response data = ", res);
        
        // Kiểm tra cấu trúc dữ liệu trả về
        if (res?.data?.rooms && Array.isArray(res.data.rooms)) {
          setRooms(res.data.rooms);
        } else {
          console.warn('Invalid rooms data structure:', res);
          setRooms([]);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setRooms([]);
      }
    };

    if (userId) {
      fetchRooms();
    }
  }, [userId]); // Bỏ rooms.length khỏi dependency để tránh infinite loop

  const filteredRooms = rooms.filter(room => {
    if (!room || !room.roomName) return false;
    if (!searchTerm || !searchTerm.trim()) return true;
    return room.roomName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const getMessageStatusIcon = (status?: string) => {
    if (!status) return '';
    
    switch (status.toUpperCase()) {
      case 'SENT': return '✓';
      case 'DELIVERED': return '✓✓';
      case 'READ': return '✓✓';
      default: return '';
    }
  };

  return (
    <div className="room-list">
      <div className="room-list-header">
        <div className="header-top">
          <h3>Danh sách phòng chat</h3>
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm phòng chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>
      
      <div className="room-list-content">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <div
              key={room.sessionId || room.id}
              className={`room-item ${selectedRoomId === room.roomId ? 'selected' : ''}`}
              onClick={() => onSelectRoom(room.sessionId || room.roomId)}
            >
              <div className="avatar-container">
                <img src={avatarUrl} className="avatar" alt="Avatar" />
                {room.unreadCount > 0 && (
                  <span className="unread-badge">
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                  </span>
                )}
              </div>
              
              <div className="room-info">
                <div className="room-header">
                  <strong>{room.roomName || 'Unnamed Room'}</strong>
                  {room.lastMessage && (
                    <span className="timestamp">
                      {formatTime(room.updatedAt || room.createdAt)}
                    </span>
                  )}
                </div>
                
                <div className="last-message-container">
                  {room.isTyping ? (
                    <div className="typing-indicator">
                      <span className="typing-text">Đang gõ</span>
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  ) : room.lastMessage ? (
                    <div className="last-message">
                      <span className="message-content">
                        {room.lastMessage.content || 'Tin nhắn không có nội dung'}
                      </span>
                      <span className="message-status">
                        {getMessageStatusIcon('READ')}
                      </span>
                    </div>
                  ) : (
                    <p className="no-message">(Không có tin nhắn)</p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-rooms">
            <p>{searchTerm ? 'Không tìm thấy phòng nào' : 'Chưa có phòng chat nào'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;