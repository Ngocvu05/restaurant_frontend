import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Spinner,
  Button,
  Badge,
  Table,
  Card,
  Container,
} from "react-bootstrap";
import moment from "moment";
import { bookingApi } from "../api/bookingApi";
import useTableCache from "../hooks/useTableCache";

interface PreOrderDish {
  dishId: number;
  quantity: number;
  dish?: {
    name: string;
    price: number;
  };
}

interface Payment {
  id: number;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentTime: string;
}

interface Booking {
  id: number;
  tableId: number;
  bookingTime: string;
  totalAmount: number;
  status: string;
  note?: string;
  preOrderDishes: PreOrderDish[];
}

const BookingDetailPage: React.FC = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { tables } = useTableCache();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      console.warn(">>> Booking ID không tồn tại");
      navigate("/bookings"); // Chuyển hướng về danh sách đặt bàn nếu không có ID
      return;
    }
 
    setLoading(true);
    const fetchDetail = async () => {
      if (!id) {
        console.warn(">>> Booking ID không tồn tại");
        setLoading(false);
        return;
      }
      try {
        const res = await bookingApi.getBookingDetail(id);
        console.log(">>> Booking Detail Response", res.data);
        setBooking(res.data.booking);
        setPayment(res.data.payment);
        setQrUrl(res.data.paymentQrUrl);
      } catch (e) {
          console.error(">>> Lỗi gọi booking detail:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const getTableName = (id: number) => {
    const table = tables.find((t) => t.id === id);
    return table ? table.tableName : `Bàn #${id}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "success";
      case "cancelled":
        return "danger";
      case "pending":
        return "warning";
      case "reserved":
        return "secondary";
      case "completed":
        return "dark";
      default:
        return "info";
    }
  };

  const handlePrint = () => {
    window.print(); // Tạm thời sử dụng in trình duyệt
  };

  if (loading || !booking) {
    return (
      <div className="text-center my-5" style={{ paddingTop: '120px' }}>
        <Spinner animation="border" variant="primary" />
        <p>Đang tải chi tiết đặt bàn...</p>
      </div>
    );
  }

  if (!booking || !booking.preOrderDishes) {
    return <p className="text-center mt-5">Không tìm thấy thông tin đặt bàn.</p>;
  }
  if (booking.preOrderDishes.length === 0) {
    return <p className="text-center mt-5">Không có món ăn nào được đặt trước.</p>;
  }
  if (!tables || tables.length === 0) {
    return <p className="text-center mt-5">Không tìm thấy thông tin bàn.</p>;
  }

  return (
    <Container className="mt-4" style={{ paddingTop: '120px' }}>
      <Card className="shadow">
        <Card.Body>
          <Card.Title>Chi tiết đặt bàn #{booking.id}</Card.Title>
          <p>
            <strong>Bàn:</strong> {getTableName(booking.tableId)}
          </p>
          <p>
            <strong>Thời gian:</strong>{" "}
            {moment(booking.bookingTime).format("HH:mm DD/MM/YYYY")}
          </p>
          <p>
            <strong>Trạng thái:</strong>{" "}
            <Badge bg={getStatusColor(booking.status)}>{booking.status}</Badge>
          </p>
          {booking.note && (
            <p>
              <strong>Ghi chú:</strong> {booking.note}
            </p>
          )}

          <hr />
          <h5>Danh sách món ăn đã đặt:</h5>
          {booking.preOrderDishes.length === 0 ? (
            <p>Không có món ăn nào được đặt trước.</p>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Tên món</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {booking.preOrderDishes.map((dish, index) => (
                  <tr key={index}>
                    <td>{dish.dish?.name || <i style={{ color: 'red' }}>Không có tên món</i>}</td>
                    <td>{dish.quantity}</td>
                    <td>
                      {dish.dish
                        ? `${dish.dish.price.toLocaleString()} VND`
                        : <span style={{ color: 'red' }}>Không có giá</span>}
                    </td>
                    <td>
                      {dish.dish
                        ? `${(dish.dish.price * dish.quantity).toLocaleString()} VND`
                        : "—"}
                    </td>
                  </tr>
                ))}

              </tbody>
            </Table>
          )}

          <h5 className="text-end mt-3">
            Tổng tiền:{" "}
            <strong>{booking.totalAmount.toLocaleString()} VND</strong>
          </h5>

          {payment && (
            <>
              <hr />
              <h5>Thông tin thanh toán:</h5>
              <p>
                <strong>Phương thức:</strong> {payment.paymentMethod}
              </p>
              <p>
                <strong>Thời gian:</strong>{" "}
                {moment(payment.paymentTime).format("HH:mm DD/MM/YYYY")}
              </p>
              <p>
                <strong>Trạng thái:</strong>{" "}
                <Badge bg={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </p>
            </>
          )}

          <div className="text-end mt-4">
            <Button variant="primary" onClick={handlePrint}>
              <i className="bi bi-printer me-2"></i>In hóa đơn
            </Button>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Thanh toán bằng QR</h5>
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="img-thumbnail"
                  style={{ maxWidth: "300px" }}
                />
              ) : (
                <p>Không tìm thấy mã QR.</p>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="text-center mt-4">
        <Button variant="secondary" onClick={() => navigate("/booking-history")}>
          <i className="bi bi-arrow-left-circle me-2"></i>Quay lại danh sách
        </Button>
      </div>
    </Container>
  );
};

export default BookingDetailPage;
