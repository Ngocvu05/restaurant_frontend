import React from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';

const mockBookingDetail = {
  id: 1,
  customerName: 'Nguyễn Văn A',
  phone: '0912345678',
  email: 'vana@example.com',
  table: 'Bàn 3',
  people: 4,
  time: '2025-06-27 18:00',
  status: 'Đã xác nhận',
  note: 'Khách cần bàn gần cửa sổ.',
  dishes: [
    { name: 'Pizza Margherita', quantity: 2, price: 150000 },
    { name: 'Spaghetti Bolognese', quantity: 1, price: 120000 },
    { name: 'Trà đào', quantity: 3, price: 30000 },
  ],
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Đã xác nhận':
      return 'success';
    case 'Đang chờ':
      return 'warning';
    case 'Đã huỷ':
      return 'danger';
    default:
      return 'secondary';
  }
};

const AdminBookingDetailPage: React.FC = () => {
  const { customerName, phone, email, table, people, time, status, note, dishes } = mockBookingDetail;

  const total = dishes.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Chi tiết đặt bàn</h3>

      <Card className="mb-4">
        <Card.Body>
          <h5>Thông tin khách hàng</h5>
          <p><strong>Họ tên:</strong> {customerName}</p>
          <p><strong>Điện thoại:</strong> {phone}</p>
          <p><strong>Email:</strong> {email}</p>

          <h5 className="mt-4">Thông tin đặt bàn</h5>
          <p><strong>Bàn:</strong> {table}</p>
          <p><strong>Số người:</strong> {people}</p>
          <p><strong>Thời gian:</strong> {time}</p>
          <p><strong>Trạng thái:</strong> <Badge bg={getStatusColor(status)}>{status}</Badge></p>
          <p><strong>Ghi chú:</strong> {note}</p>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <h5>Món ăn đã đặt</h5>
          <Table responsive bordered>
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Tên món</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {dishes.map((dish, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{dish.name}</td>
                  <td>{dish.quantity}</td>
                  <td>{dish.price.toLocaleString()}₫</td>
                  <td>{(dish.price * dish.quantity).toLocaleString()}₫</td>
                </tr>
              ))}
              <tr className="fw-bold">
                <td colSpan={4} className="text-end">Tổng cộng</td>
                <td>{total.toLocaleString()}₫</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="mt-3 text-end">
        <Button variant="secondary" href="/admin/bookings">Quay lại danh sách</Button>
      </div>
    </div>
  );
};

export default AdminBookingDetailPage;
