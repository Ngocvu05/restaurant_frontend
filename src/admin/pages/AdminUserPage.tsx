import React from 'react';
import { Table, Badge, Button, Card } from 'react-bootstrap';

const mockUsers = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    email: 'vana@example.com',
    phone: '0912345678',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Trần Thị B',
    email: 'tranb@example.com',
    phone: '0934567890',
    role: 'User',
    status: 'Inactive',
  },
  {
    id: 3,
    name: 'Phạm Văn C',
    email: 'phamc@example.com',
    phone: '0987654321',
    role: 'User',
    status: 'Active',
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Active':
      return <Badge bg="success">Đang hoạt động</Badge>;
    case 'Inactive':
      return <Badge bg="secondary">Ngưng hoạt động</Badge>;
    default:
      return <Badge bg="warning">Không rõ</Badge>;
  }
};

const AdminUserPage: React.FC = () => {
  return (
    <div className="container mt-4">
      <h3 className="mb-4">Quản lý người dùng</h3>

      <Card>
        <Card.Body>
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
              {mockUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>
                    <Badge bg={user.role === 'Admin' ? 'primary' : 'info'}>{user.role}</Badge>
                  </td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>
                    <Button size="sm" variant="warning" className="me-2">Chỉnh sửa</Button>
                    <Button size="sm" variant="danger">Khoá</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminUserPage;
