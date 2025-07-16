import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Form, Button, Container } from 'react-bootstrap';
import { UserApi } from '../api/UserApi';
import AvatarGallery from '../components/AvatarGallery';

interface FormData {
  fullName: string;
  email: string;
  phone_number: string;
  address: string;
  avatar: string;
}

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone_number: '',
    address: '',
    avatar: '',
  });
  const [loading, setLoading] = useState(false);
  const avatar = sessionStorage.getItem('avatar') || '';

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await UserApi.getProfile();
      const user = res.data;
      console.log('User profile data:', user);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        avatar: user.avatar || user.images?.find((img: any) => img.avatar)?.url || avatar,
      });
    } catch (err) {
      console.error('Lỗi khi tải thông tin người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await UserApi.updateProfile(formData);
      alert('Cập nhật thông tin thành công!');
      navigate('/profile');
    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
      alert('Đã xảy ra lỗi khi cập nhật thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <h3 className="mb-4">Chỉnh sửa thông tin cá nhân</h3>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Họ và tên</Form.Label>
            <Form.Control
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Địa chỉ</Form.Label>
            <Form.Control
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Cập nhật'}
          </Button>
        </Form>
      )}

      <hr className="my-4" />
      <AvatarGallery />
    </Container>
  );
};

export default EditProfilePage;
