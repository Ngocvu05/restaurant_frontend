import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Form, Button, Container, Card, Row, Col } from 'react-bootstrap';
import { UserApi } from '../api/UserApi';
import AvatarGallery from '../components/AvatarGallery';

interface FormData {
  fullName: string;
  email: string;
  phone_number: string;
  address: string;
  avatar: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra xác nhận mật khẩu
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    // Kiểm tra độ mạnh mật khẩu (tối thiểu 6 ký tự)
    if (passwordData.newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setPasswordLoading(true);
    try {
      // Giả sử API có endpoint changePassword
      await UserApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      alert('Đổi mật khẩu thành công!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (err: any) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      
      // Xử lý các loại lỗi khác nhau
      if (err.response?.status === 400) {
        alert('Mật khẩu hiện tại không chính xác!');
      } else if (err.response?.status === 422) {
        alert('Mật khẩu mới không hợp lệ!');
      } else {
        alert('Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại!');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <h3 className="mb-4">Chỉnh sửa thông tin cá nhân</h3>
      
      <Row>
        {/* Cột trái - Form cập nhật thông tin */}
        <Col md={8}>
          {/* Form cập nhật thông tin cá nhân */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Thông tin cá nhân</h5>
            </Card.Header>
            <Card.Body>
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
                    {loading ? 'Đang lưu...' : 'Cập nhật thông tin'}
                  </Button>
                </Form>
              )}
            </Card.Body>
          </Card>

          {/* Form đổi mật khẩu */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Bảo mật</h5>
              <Button
                variant={showPasswordForm ? "secondary" : "outline-primary"}
                size="sm"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                {showPasswordForm ? 'Hủy' : 'Đổi mật khẩu'}
              </Button>
            </Card.Header>
            
            {showPasswordForm && (
              <Card.Body>
                <Form onSubmit={handlePasswordSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu hiện tại</Form.Label>
                    <Form.Control
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu mới</Form.Label>
                    <Form.Control
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                      minLength={6}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      minLength={6}
                    />
                  </Form.Group>

                  <Button 
                    type="submit" 
                    variant="warning" 
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                  </Button>
                </Form>
              </Card.Body>
            )}
          </Card>
        </Col>

        {/* Cột phải - Avatar Gallery */}
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Chọn ảnh đại diện</h5>
            </Card.Header>
            <Card.Body>
              <AvatarGallery />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditProfilePage;