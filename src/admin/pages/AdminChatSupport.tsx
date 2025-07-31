import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminChatApi } from '../api/adminChatApi';
import { stat } from 'fs';

// Định nghĩa cấu trúc của một phòng chat
interface ChatRoom {
  id: number;
  roomId: string;
  sessionId: string;
  roomName: string;
  userId: number;
  userName: string;
  lastMessage?: {
    content: string;
    senderName: string;
  };
  updatedAt: string;
  resolved: boolean;
  adminId?: number;
}

const AdminChatSupport: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentAdminId = Number(sessionStorage.getItem('userId'));

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        // Gọi API để lấy tất cả phòng chat (API này cần được tạo ở backend)
        const res = await adminChatApi.getAllCustomerRooms();
        console.log('Fetched rooms:', res.data);
        setRooms(res.data || []);
      } catch (error) {
        toast.error('Không thể tải danh sách phòng chat.');
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleJoinRoom = async (room: ChatRoom) => {
    try {
      await adminChatApi.joinRoom(room.roomId);
      toast.success(`Đã tham gia phòng: ${room.roomName}`);
      // Điều hướng đến trang chat chính
      // Trang /chat cần được thiết kế để nhận roomId và tải cuộc trò chuyện
      navigate(`/admin/chat-support/${room.roomId}`,{
        state: {
          roomId: room.roomId, 
          sessionId: room.sessionId,
        }
      }); 
    } catch (error: any) {
      // Dựa vào mã lỗi từ backend để hiển thị thông báo chính xác
      const errorMessage = error.response?.data?.message || 'Không thể tham gia phòng chat này.';
      toast.error(errorMessage);
      console.error('Error joining room:', error);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }
  
  return (
    <div className="container-fluid">
      <h3 className="h3 mb-4 text-gray-800">Trung tâm phản hồi Chat</h3>
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Danh sách các cuộc trò chuyện</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover" id="dataTable" width="100%" cellSpacing="0">
              <thead>
                <tr>
                  <th>Tên phòng</th>
                  <th>Người dùng</th>
                  <th>Trạng thái</th>
                  <th>Admin đang xử lý</th>
                  <th>Cập nhật lần cuối</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">Chưa có cuộc trò chuyện nào.</td>
                  </tr>
                ) : (
                  rooms.map(room => (
                    <tr key={room.roomId} className={room.resolved ? 'table-secondary' : ''}>
                      <td>{room.roomName}</td>
                      <td>{room.userName}</td>
                      <td>
                        {room.resolved 
                          ? <span className="badge bg-success">Đã xử lý</span>
                          : <span className="badge bg-warning text-dark">Chờ phản hồi</span>
                        }
                      </td>
                       <td>
                        {room.adminId 
                          ? (room.adminId === currentAdminId ? <span className="badge bg-info">Bạn</span> : `Admin ${room.adminId}`)
                          : 'Chưa có'
                        }
                      </td>
                      <td>{new Date(room.updatedAt).toLocaleString('vi-VN')}</td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleJoinRoom(room)}
                        >
                          <i className="bi bi-box-arrow-in-right me-1"></i>
                          {room.adminId === currentAdminId ? 'Vào lại' : 'Tham gia'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatSupport;