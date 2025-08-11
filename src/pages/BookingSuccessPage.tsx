import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Alert } from 'react-bootstrap';
import PaymentComponent from '../components/PaymentComponent';
import { PaymentStatus } from '../api/paymentApi';
import '../assets/css/BookingSuccess.css';

const BookingSuccessPage: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');

  if (!state) {
    navigate('/');
    return null;
  }

  const {
    fullName,
    tableName,
    bookingTime,
    guests,
    note,
    preOrderDishes,
    email,
    bookingId,
    tableId
  } = state;

  const total = preOrderDishes?.reduce(
    (sum: number, item: any) => sum + item.quantity * item.price,
    0
  );

  // Payment handlers
  const handlePaymentSuccess = (payment: PaymentStatus) => {
    setPaymentStatus(payment);
    setPaymentError('');
    setShowPaymentModal(false);
    console.log('Payment successful:', payment);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    console.error('Payment error:', error);
  };

  const handleOpenPayment = () => {
    if (!bookingId || !total || total <= 0) {
      setPaymentError('Không thể thực hiện thanh toán: Thiếu thông tin đặt bàn hoặc số tiền');
      return;
    }
    setShowPaymentModal(true);
    setPaymentError('');
  };

  return (
    <div className="container py-5" style={{ paddingTop: '120px' }}>
      <div className="card shadow p-4">
        <h2 className="text-center text-success mb-4" style={{ marginTop: '40px' }}>
          🎉 Đặt bàn thành công!
        </h2>
    
        <div className="row">
          <div className="col-md-6">
            <p><strong>Khách hàng:</strong> {fullName}</p>
            <p><strong>Email xác nhận:</strong> {email}</p>
            <p><strong>Bàn:</strong> {tableName}</p>
          </div>
          <div className="col-md-6">
            <p><strong>Thời gian:</strong> {new Date(bookingTime).toLocaleString('vi-VN')}</p>
            <p><strong>Số khách:</strong> {guests}</p>
            {note && <p><strong>Ghi chú:</strong> {note}</p>}
          </div>
        </div>

        {/* Payment Status Alert */}
        {paymentStatus && (
          <Alert variant="success" className="mt-3">
            <Alert.Heading>
              <i className="bi bi-check-circle me-2"></i>
              Thanh toán thành công!
            </Alert.Heading>
            <p className="mb-0">
              <strong>Phương thức:</strong> {paymentStatus.paymentMethod}<br/>
              <strong>Mã giao dịch:</strong> {paymentStatus.transactionId || paymentStatus.id}<br/>
              {paymentStatus.paymentTime && (
                <>
                  <strong>Thời gian:</strong> {new Date(paymentStatus.paymentTime).toLocaleString('vi-VN')}
                </>
              )}
            </p>
          </Alert>
        )}

        {paymentError && (
          <Alert variant="danger" className="mt-3" dismissible onClose={() => setPaymentError('')}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Lỗi thanh toán: {paymentError}
          </Alert>
        )}

        {preOrderDishes && preOrderDishes.length > 0 && (
          <>
            <div className="mt-4">
              <h5>
                <i className="bi bi-list-ul me-2"></i>
                Món ăn đã chọn
              </h5>
              <div className="table-responsive">
                <table className="table table-bordered mt-2">
                  <thead className="table-light">
                    <tr>
                      <th>Ảnh</th>
                      <th>Tên món</th>
                      <th>Đơn giá</th>
                      <th>Số lượng</th>
                      <th>Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preOrderDishes.map((dish: any, index: number) => (
                      <tr key={index}>
                        <td>
                          <img
                            src={`http://localhost:8080/${dish.imageUrl}`}
                            alt={dish.name}
                            width="60"
                            height="40"
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                          />
                        </td>
                        <td>{dish.name}</td>
                        <td>{dish.price.toLocaleString()}₫</td>
                        <td>{dish.quantity}</td>
                        <td>{(dish.quantity * dish.price).toLocaleString()}₫</td>
                      </tr>
                    ))}
                    <tr className="table-success">
                      <td colSpan={4} className="text-end"><strong>Tổng cộng:</strong></td>
                      <td><strong>{total.toLocaleString()}₫</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Simplified Payment Section - Now handled by PaymentComponent */}
            {!paymentStatus && (
              <div className="mt-4 text-center">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Thanh toán ngay để hoàn tất đặt bàn</strong>
                </div>
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={handleOpenPayment}
                  disabled={!bookingId || !total || total <= 0}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  Thanh toán ({total.toLocaleString()}₫)
                </Button>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="text-center mt-4">
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <Button 
              variant="outline-primary" 
              className="px-4" 
              onClick={() => navigate('/')}
            >
              <i className="bi bi-house me-2"></i>
              Về trang chủ
            </Button>
            <Button 
              variant="outline-secondary" 
              className="px-4" 
              onClick={() => window.print()}
            >
              <i className="bi bi-printer me-2"></i>
              In hóa đơn
            </Button>
            {preOrderDishes && preOrderDishes.length > 0 && !paymentStatus && (
              <Button 
                variant="outline-success" 
                className="px-4"
                onClick={handleOpenPayment}
                disabled={!bookingId || !total || total <= 0}
              >
                <i className="bi bi-credit-card me-2"></i>
                Thanh toán ngay
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Payment Modal */}
      {bookingId && total && total > 0 && (
        <PaymentComponent
          bookingId={bookingId}
          amount={total}
          customerName={fullName}
          tableName={tableName}
          orderInfo={`Thanh toán đặt bàn ${tableName} - ${fullName}`}
          showModal={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
};

export default BookingSuccessPage;