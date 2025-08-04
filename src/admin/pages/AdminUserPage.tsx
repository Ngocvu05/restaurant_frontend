import React, { useEffect, useState } from 'react';
import { Table, Badge, Button, Card, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import userApi from '../api/getUserInfoApi';
import { UserDTO } from '../api/getUserInfoApi';

const getStatusBadge = (status: string | undefined) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge bg="success">Đang hoạt động</Badge>;
    case 'INACTIVE':
      return <Badge bg="secondary">Ngưng hoạt động</Badge>;
    default:
      return <Badge bg="warning">Không rõ</Badge>;
  }
};

const AdminUserPage: React.FC = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await userApi.getAll();
      setUsers(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/admin/users/${id}`);
  };

  const handleDeactivate = async (user: UserDTO) => {
    if (!user.id) return;

    try {
      const updated = { ...user, status: 'INACTIVE' as const };
      await userApi.update(user.id, updated);
      fetchUsers();
    } catch (err) {
      console.error('Lỗi khi khoá người dùng:', err);
    }
  };

  const handleCreate = () => {
    navigate('/admin/users/new');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Quản lý người dùng</h3>
        <Button variant="primary" onClick={handleCreate}>
          + Thêm người dùng
        </Button>
      </div>

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <Table responsive bordered hover>
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.phone_number}</td>
                    <td>
                      <Badge bg={user.roleType === 'ADMIN' ? 'primary' : 'info'}>
                        {user.roleType}
                      </Badge>
                    </td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="warning"
                        className="me-2"
                        onClick={() => handleEdit(user.id!)}
                      >
                        Chỉnh sửa
                      </Button>
                      {user.status !== 'INACTIVE' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeactivate(user)}
                        >
                          Khoá
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminUserPage;
