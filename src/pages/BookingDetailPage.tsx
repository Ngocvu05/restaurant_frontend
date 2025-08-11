import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner, Button, Badge, Table, Card, Container, Row, Col, Modal } from "react-bootstrap";
import moment from "moment";
import { bookingApi } from "../api/bookingApi";
import useTableCache from "../hooks/useTableCache";
import PaymentComponent from "../components/PaymentComponent";
import { PaymentStatus } from "../api/paymentApi";

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
  transactionId?: string;
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { tables } = useTableCache();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      console.warn(">>> Booking ID không tồn tại");
      navigate("/bookings");
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
  }, [id, navigate]);

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

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
        return "success";
      case "failed":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "info";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePaymentSuccess = (paymentResult: PaymentStatus) => {
    console.log("Payment successful:", paymentResult);
    setPayment({
      id: paymentResult.id,
      amount: paymentResult.amount,
      paymentMethod: paymentResult.paymentMethod,
      status: paymentResult.status,
      paymentTime: paymentResult.paymentTime || new Date().toISOString(),
      transactionId: paymentResult.transactionId
    });
    setShowPaymentModal(false);
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
    // Handle error (show toast, etc.)
  };

  const canMakePayment = () => {
    return booking && 
           (booking.status.toLowerCase() === 'confirmed' || booking.status.toLowerCase() === 'pending') &&
           (!payment || payment.status.toLowerCase() !== 'success');
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

  return (
    <Container className="mt-4" style={{ paddingTop: '120px' }}>
      <Card className="shadow">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title>Chi tiết đặt bàn #{booking.id}</Card.Title>
            <div>
              {canMakePayment() && (
                <Button 
                  variant="success" 
                  className="me-2"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <i className="bi bi-credit-card me-2"></i>Thanh toán
                </Button>
              )}
              <Button variant="outline-primary" onClick={handlePrint}>
                <i className="bi bi-printer me-2"></i>In hóa đơn
              </Button>
            </div>
          </div>

          <Row>
            <Col md={6}>
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
            </Col>
            <Col md={6}>
              {booking.note && (
                <p>
                  <strong>Ghi chú:</strong> {booking.note}
                </p>
              )}
              <h5 className="text-primary">
                Tổng tiền: <strong>{booking.totalAmount.toLocaleString()} VND</strong>
              </h5>
            </Col>
          </Row>

          <hr />
          <h5>Danh sách món ăn đã đặt:</h5>
          {booking.preOrderDishes.length === 0 ? (
            <p>Không có món ăn nào được đặt trước.</p>
          ) : (
            <Table striped bordered hover responsive>
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
              <tfoot>
                <tr className="table-success">
                  <td colSpan={3} className="text-end"><strong>Tổng cộng:</strong></td>
                  <td><strong>{booking.totalAmount.toLocaleString()} VND</strong></td>
                </tr>
              </tfoot>
            </Table>
          )}

          {payment && (
            <>
              <hr />
              <h5>Thông tin thanh toán:</h5>
              <Row>
                <Col md={6}>
                  <p>
                    <strong>Phương thức:</strong> {payment.paymentMethod}
                  </p>
                  <p>
                    <strong>Số tiền:</strong> {payment.amount.toLocaleString()} VND
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Thời gian:</strong>{" "}
                    {moment(payment.paymentTime).format("HH:mm DD/MM/YYYY")}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    <Badge bg={getPaymentStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </p>
                  {payment.transactionId && (
                    <p>
                      <strong>Mã giao dịch:</strong> {payment.transactionId}
                    </p>
                  )}
                </Col>
              </Row>
            </>
          )}

          {qrUrl && (
            <div className="card mt-4">
              <div className="card-body">
                <h5 className="card-title">Thanh toán bằng QR</h5>
                <div className="text-center">
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="img-thumbnail"
                    style={{ maxWidth: "300px" }}
                  />
                  <p className="mt-2 text-muted">
                    Quét mã QR để thanh toán nhanh chóng
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="text-center mt-4">
        <Button variant="secondary" onClick={() => navigate("/booking-history")}>
          <i className="bi bi-arrow-left-circle me-2"></i>Quay lại danh sách
        </Button>
      </div>

      {/* Payment Modal */}
      <PaymentComponent
        showModal={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookingId={booking.id}
        amount={booking.totalAmount}
        orderInfo={`Thanh toán đặt bàn #${booking.id} - ${getTableName(booking.tableId)}`}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </Container>
  );
};

export default BookingDetailPage;