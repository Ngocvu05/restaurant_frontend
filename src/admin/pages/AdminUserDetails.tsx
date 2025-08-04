import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import userApi from '../api/getUserInfoApi';
import { RoleName, UserDTO, UserStatus } from '../api/getUserInfoApi';

const defaultUser: UserDTO = {
  username: '',
  fullName: '',
  email: '',
  phone_number: '',
  address: '',
  roleType: 'CUSTOMER',
  status: 'ACTIVE',
};

const AdminUserDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [user, setUser] = useState<UserDTO>(defaultUser);
  const [loading, setLoading] = useState<boolean>(!isNew);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!isNew && id) {
      userApi.getById(Number(id))
        .then(res => setUser(res.data))
        .catch(err => console.error('Lỗi tải user:', err))
        .finally(() => setLoading(false));
    } else{
        setLoading(false);
    }
  }, [id, isNew]);

  const handleChange = (field: keyof UserDTO, value: any) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isNew) {
        await userApi.create(user);
      } else if (id) {
        await userApi.update(Number(id), user);
      }
      navigate('/admin/users');
    } catch (err) {
      console.error('Lỗi khi lưu user:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Đang tải dữ liệu người dùng...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h3>{isNew ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}</h3>

      <Card className="mt-3">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={user.username}
                onChange={e => handleChange('username', e.target.value)}
                required
              />
            </Form.Group>

            {!user.id && (
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={user.password || ''}
                  onChange={e => handleChange('password', e.target.value)}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Họ tên</Form.Label>
              <Form.Control
                type="text"
                value={user.fullName || ''}
                onChange={e => handleChange('fullName', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={user.email || ''}
                onChange={e => handleChange('email', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                type="text"
                value={user.phone_number || ''}
                onChange={e => handleChange('phone_number', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control
                type="text"
                value={user.address || ''}
                onChange={e => handleChange('address', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vai trò</Form.Label>
              <Form.Select
                value={user.roleType}
                onChange={e => handleChange('roleType', e.target.value as RoleName)}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={user.status}
                onChange={e => handleChange('status', e.target.value as UserStatus)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate('/admin/users')}>
                Quay lại
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminUserDetails;
