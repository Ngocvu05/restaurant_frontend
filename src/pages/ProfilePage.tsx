import React, { useEffect, useState } from 'react';
import { UserApi } from '../api/UserApi';

interface Image {
  id: number;
  url: string;
  avatar: boolean;
}

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone_number: string;
  address: string;
  roleType: string;
  createdAt: string;
  images?: Image[];
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
    const [images, setImages] = useState<Image[]>([]);
    
  useEffect(() => {
    UserApi.getProfile()
      .then((res: any) => {
        setUser(res.data);
        setImages(res.data.images || []);
      })
      .catch((err: any) => {
        alert('Lỗi: ' + (err.response?.data?.message || err.message));
      });
  }, []);

  // Determine avatar image URL
  const avatarImgUrl =
    user && user.images && user.images.length > 0
      ? (user.images.find((img: Image) => img.avatar)?.url || user.images[0].url)
      : '/assets/images/avatar.png';

  if (!user) return <div className="container py-5">Đang tải thông tin...</div>;

  return (
    <div className="container py-5">
      <h2 className="mb-4">Thông tin cá nhân</h2>
      <div className="card p-4">
        <div className="d-flex align-items-center gap-4 mb-3">
          <img
            src={avatarImgUrl}
            alt="Avatar"
            width="100"
            height="100"
            className="rounded-circle"
          />
          <div>
            <h4>{user.fullName || user.username}</h4>
            <p className="mb-0"><strong>Vai trò:</strong> {user.roleType}</p>
            <p><strong>Ngày tạo:</strong> {new Date(user.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <p><strong>Tên đăng nhập:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>SĐT:</strong> {user.phone_number}</p>
          </div>
          <div className="col-md-6">
            <p><strong>Địa chỉ:</strong> {user.address}</p>
          </div>
        </div>

        <div className="d-flex gap-3 mt-4">
          <button className="btn btn-primary" onClick={() => window.location.href = '/profile/edit'}>
            Cập nhật thông tin
          </button>
          <button className="btn btn-warning" onClick={() => window.location.href = '/profile/change-password'}>
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
