import React, { useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { chatApi } from '../api/chatApi';

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
      console.log(res.data.rooms);
      setRooms(res.data.rooms || []);
    };
    fetchRooms();
  }, []);

  return (
    <List
      height={window.innerHeight - 100}
      itemCount={rooms.length}
      itemSize={60}
      width={'100%'}
    >
      {({ index, style }) => {
        const room = rooms[index];
        return (
          <div
            style={style}
            className={`room-item ${selectedRoomId === room.id ? 'selected' : ''}`}
            onClick={() => onSelectRoom(room.id)}
          >
            <img src={avatarUrl || '/default-avatar.png'} className="avatar" />
            <div>
              <strong>{room.name}</strong>
              <p className="last-message">{room.lastMessage}</p>
            </div>
          </div>
        );
      }}
    </List>
  );
};

export default RoomList;
