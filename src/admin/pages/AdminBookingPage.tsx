import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';

const mockBookings = [
  {
    id: 1,
    customerName: 'Nguyễn Văn A',
    table: 'Bàn 3',
    time: '2025-06-27 18:00',
    people: 4,
    status: 'Đã xác nhận',
  },
  {
    id: 2,
    customerName: 'Trần Thị B',
    table: 'Bàn 1',
    time: '2025-06-27 19:30',
    people: 2,
    status: 'Đang chờ',
  },
  {
    id: 3,
    customerName: 'Lê Văn C',
    table: 'Bàn 5',
    time: '2025-06-28 12:00',
    people: 6,
    status: 'Đã huỷ',
  },
];

const statusColor = (status: string) => {
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

const AdminBookingPage: React.FC = () => {
  return (
    <div className="container mt-4">
      <h3 className="mb-4">Danh sách đặt bàn</h3>
      <Table responsive bordered hover>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Khách hàng</th>
            <th>Bàn</th>
            <th>Thời gian</th>
            <th>Số người</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {mockBookings.map((booking, index) => (
            <tr key={booking.id}>
              <td>{index + 1}</td>
              <td>{booking.customerName}</td>
              <td>{booking.table}</td>
              <td>{booking.time}</td>
              <td>{booking.people}</td>
              <td>
                <Badge bg={statusColor(booking.status)}>{booking.status}</Badge>
              </td>
              <td>
                <Button size="sm" variant="info" className="me-2" href={`/admin/bookings/${booking.id}`}>
                    Chi tiết
                </Button>
                <Button size="sm" variant="danger">Huỷ</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminBookingPage;
