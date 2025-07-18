// src/components/RoomList.tsx
import React, { useEffect, useState } from 'react';
import { chatApi } from '../api/chatApi';

interface Props {
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

const RoomList: React.FC<Props> = ({ selectedRoomId, onSelectRoom }) => {
const [rooms, setRooms] = useState<any[]>([]);
const userId = Number(sessionStorage.getItem('userId'));

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await chatApi.getUserRooms(userId);
        setRooms(res.data || []);
      } catch (e) {
        console.error('❌ Lỗi tải danh sách room:', e);
      }
    };

    fetchRooms();
  }, []);

  return (
    <div className="room-list">
      <h4>📂 Danh sách phòng</h4>
      {rooms.map((room) => (
        <div
          key={room.id}
          className={`room-item ${selectedRoomId === room.id ? 'selected' : ''}`}
          onClick={() => onSelectRoom(room.id)}
        >
          🗨️ Room: {room.id}
        </div>
      ))}
    </div>
  );
};

export default RoomList;
