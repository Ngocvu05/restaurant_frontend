import React, { useEffect, useState } from 'react';
import { chatApi } from '../api/chatApi';
import '../assets/css/ChatPage.css';

interface Props {
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

const RoomList: React.FC<Props> = ({ selectedRoomId, onSelectRoom }) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const userId = Number(sessionStorage.getItem('userId'));
  const avatarUrl = sessionStorage.getItem('avatar') || './assets/images/avatar.png';

  useEffect(() => {
    const fetchRooms = async () => {
      const res = await chatApi.getUserRooms(userId);
      setRooms(res.data.rooms || []);
    };
    fetchRooms();
  }, []);

  return (
    <div style={{ paddingTop: '120px' }}>
      {rooms.map((room) => (
        <div
          key={room.id}
          className={`room-item ${selectedRoomId === room.id ? 'selected' : ''}`}
          onClick={() => onSelectRoom(room.id)}
        >
          <img src={avatarUrl} className="avatar" />
          <div>
            <strong>{room.roomName || 'Không tên'}</strong>
            <p className="last-message">{room.lastMessage?.content || '(Không có tin nhắn)'}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomList;