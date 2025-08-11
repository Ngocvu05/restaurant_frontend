import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Alert, Spinner, Badge, Row, Col, Tab, Tabs } from 'react-bootstrap';
import { paymentApi, CreatePaymentRequest, PaymentStatus, SupportedPaymentMethods } from '../api/paymentApi';

interface PaymentComponentProps {
  bookingId: number;
  amount: number;
  orderInfo?: string;
  customerName?: string;
  tableName?: string;
  onPaymentSuccess?: (payment: PaymentStatus) => void;
  onPaymentError?: (error: string) => void;
  showModal?: boolean;
  onClose?: () => void;
}

// VietQR Configuration
const VIETQR_CONFIG = {
  bankCode: 'shinhanbank',
  accountNo: '700071578802',
  accountName: 'DINH NGOC VU',
  baseUrl: 'https://img.vietqr.io/image'
};

const PaymentComponent: React.FC<PaymentComponentProps> = ({
  bookingId,
  amount,
  orderInfo,
  customerName,
  tableName,
  onPaymentSuccess,
  onPaymentError,
  showModal = false,
  onClose
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<SupportedPaymentMethods | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [currentPayment, setCurrentPayment] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState('online');

  // Generate VietQR URL
  const generateVietQRUrl = (amount: number, addInfo: string) => {
    const encodedAddInfo = encodeURIComponent(addInfo);
    const encodedAccountName = encodeURIComponent(VIETQR_CONFIG.accountName);
    return `${VIETQR_CONFIG.baseUrl}/${VIETQR_CONFIG.bankCode}-${VIETQR_CONFIG.accountNo}-print.png?amount=${amount}&addInfo=${encodedAddInfo}&accountName=${encodedAccountName}`;
  };

  // Generate transfer info
  const getTransferInfo = () => {
    const addInfo = `thanh toan dat ban ${bookingId}${customerName ? ` - ${customerName}` : ''}`;
    return {
      addInfo,
      qrUrl: generateVietQRUrl(amount, addInfo)
    };
  };

  // Load supported payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await paymentApi.getSupportedPaymentMethods();
        if (response.success) {
          setPaymentMethods(response.data);
        }
      } catch (err) {
        console.error('Error loading payment methods:', err);
        setError('Không thể tải danh sách phương thức thanh toán');
      }
    };

    loadPaymentMethods();
  }, []);

  // Handle payment creation
  const handleCreatePayment = async () => {
    if (!selectedMethod) {
      setError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const request: CreatePaymentRequest = {
        paymentMethod: selectedMethod,
        bookingId,
        amount,
        orderInfo: orderInfo || `Thanh toán đặt bàn #${bookingId}`
      };

      const response = await paymentApi.createPayment(request);

      if (response.success) {
        setSuccess('Tạo yêu cầu thanh toán thành công!');
        
        // Handle different payment methods
        if (selectedMethod === 'VNPAY' || selectedMethod === 'MOMO') {
          // Redirect to payment gateway
          if (response.data.paymentUrl) {
            setPaymentUrl(response.data.paymentUrl);
            // Open payment URL in new window/tab
            window.open(response.data.paymentUrl, '_blank');
          }
        } else if (selectedMethod === 'CASH') {
          // For cash payment, mark as pending
          setCurrentPayment({
            id: response.data.paymentId,
            bookingId,
            amount,
            paymentMethod: selectedMethod,
            status: 'PENDING',
            paymentTime: new Date().toISOString()
          });
          
          if (onPaymentSuccess) {
            onPaymentSuccess({
              id: response.data.paymentId,
              bookingId,
              amount,
              paymentMethod: selectedMethod,
              status: 'PENDING',
              paymentTime: new Date().toISOString()
            });
          }
        }

        // Poll for payment status if needed
        if (selectedMethod !== 'CASH') {
          pollPaymentStatus(response.data.paymentId);
        }
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tạo thanh toán');
      }
    } catch (err: any) {
      console.error('Payment creation error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán');
      if (onPaymentError) {
        onPaymentError(err.response?.data?.message || 'Payment creation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle manual transfer confirmation
  const handleTransferConfirmation = () => {
    const { addInfo } = getTransferInfo();
    
    const confirmMessage = `
Xác nhận bạn đã chuyển khoản với thông tin:
- Số tiền: ${amount.toLocaleString()}₫
- Nội dung: ${addInfo}
- Số tài khoản: ${VIETQR_CONFIG.accountNo}
- Ngân hàng: Shinhan Bank

Vui lòng đợi xác nhận từ nhà hàng.
    `;
    
    if (window.confirm(confirmMessage.trim())) {
      const transferPayment: PaymentStatus = {
        id: Date.now(),
        bookingId: bookingId,
        amount: amount,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        paymentTime: new Date().toISOString(),
        transactionId: `TRANSFER_${bookingId}_${Date.now()}`
      };
      
      setCurrentPayment(transferPayment);
      setSuccess('Cảm ơn bạn! Chúng tôi sẽ xác nhận thanh toán trong thời gian sớm nhất.');
      
      if (onPaymentSuccess) {
        onPaymentSuccess(transferPayment);
      }
    }
  };

  // Poll payment status
  const pollPaymentStatus = async (paymentId: number) => {
    const maxPolls = 30; // Poll for 5 minutes (10s intervals)
    let pollCount = 0;

    const poll = async () => {
      try {
        const response = await paymentApi.getPaymentStatus(paymentId);
        
        if (response.success) {
          const payment = response.data;
          setCurrentPayment(payment);

          if (payment.status === 'SUCCESS' || payment.status === 'COMPLETED') {
            setSuccess('Thanh toán thành công!');
            if (onPaymentSuccess) {
              onPaymentSuccess(payment);
            }
            return;
          } else if (payment.status === 'FAILED') {
            setError('Thanh toán thất bại');
            if (onPaymentError) {
              onPaymentError('Payment failed');
            }
            return;
          }
        }

        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    };

    poll();
  };

  // Render payment method options
  const renderPaymentMethods = () => {
    if (!paymentMethods) return null;

    return Object.entries(paymentMethods)
      .filter(([_, method]) => method.enabled)
      .map(([key, method]) => (
        <Form.Check
          key={key}
          type="radio"
          id={key}
          name="paymentMethod"
          value={key}
          label={
            <div className="d-flex align-items-center">
              <img 
                src={`/images/payment/${method.icon}`} 
                alt={method.name}
                width="32"
                height="32"
                className="me-2"
                onError={(e) => {
                  // Fallback if image not found
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <div><strong>{method.name}</strong></div>
                <small className="text-muted">{method.description}</small>
              </div>
            </div>
          }
          checked={selectedMethod === key}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="mb-3"
        />
      ));
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Render QR payment tab
  const renderQRPayment = () => {
    const { addInfo, qrUrl } = getTransferInfo();

    return (
      <div className="text-center">
        <div className="mb-3">
          <img 
            src={qrUrl} 
            alt="VietQR Code" 
            style={{ 
              maxWidth: '250px', 
              height: 'auto',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              padding: '10px',
              backgroundColor: 'white'
            }}
            onError={(e) => {
              console.error('QR Image load error:', e);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        
        <div className="mb-3 text-start" style={{ fontSize: '0.9em' }}>
          <div className="border rounded p-3 bg-light">
            <Row>
              <Col md={6}>
                <p className="mb-2"><strong>Ngân hàng:</strong> Shinhan Bank</p>
                <p className="mb-2"><strong>Số TK:</strong> {VIETQR_CONFIG.accountNo}</p>
                <p className="mb-2"><strong>Chủ TK:</strong> {VIETQR_CONFIG.accountName}</p>
              </Col>
              <Col md={6}>
                <p className="mb-2"><strong>Số tiền:</strong> <span className="text-danger fw-bold">{amount.toLocaleString()}₫</span></p>
                <p className="mb-2"><strong>Nội dung:</strong> <code>{addInfo}</code></p>
              </Col>
            </Row>
          </div>
        </div>

        <Alert variant="info" className="text-start">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Hướng dẫn:</strong>
          <ol className="mb-0 mt-2">
            <li>Mở app ngân hàng hoặc ví điện tử</li>
            <li>Chọn "Quét mã QR" hoặc "Chuyển khoản QR"</li>
            <li>Quét mã QR phía trên</li>
            <li>Kiểm tra thông tin và xác nhận chuyển khoản</li>
          </ol>
        </Alert>

        <Button 
          variant="success" 
          size="lg"
          onClick={handleTransferConfirmation}
          disabled={currentPayment?.status === 'PENDING'}
          className="w-100"
        >
          <i className="bi bi-check-circle me-2"></i>
          {currentPayment?.status === 'PENDING' ? 'Đã xác nhận chuyển khoản' : 'Tôi đã chuyển khoản'}
        </Button>
      </div>
    );
  };

  const content = (
    <div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <div className="mb-4">
        <h5>Thông tin thanh toán</h5>
        <Row>
          <Col md={6}>
            <p><strong>Mã đặt bàn:</strong> #{bookingId}</p>
            <p><strong>Số tiền:</strong> <span className="text-primary fw-bold">{amount.toLocaleString()} VND</span></p>
          </Col>
          <Col md={6}>
            {tableName && <p><strong>Bàn:</strong> {tableName}</p>}
            {customerName && <p><strong>Khách hàng:</strong> {customerName}</p>}
            {orderInfo && <p><strong>Mô tả:</strong> {orderInfo}</p>}
          </Col>
        </Row>
      </div>

      {currentPayment && (
        <div className="mb-4">
          <h5>Trạng thái thanh toán</h5>
          <div className="d-flex align-items-center">
            <Badge bg={getStatusBadgeVariant(currentPayment.status)} className="me-2">
              {currentPayment.status}
            </Badge>
            <span>Phương thức: {currentPayment.paymentMethod}</span>
          </div>
          {currentPayment.transactionId && (
            <p className="mb-0 mt-2"><small>Mã giao dịch: {currentPayment.transactionId}</small></p>
          )}
        </div>
      )}

      {!currentPayment || (currentPayment.status === 'PENDING' && currentPayment.paymentMethod !== 'BANK_TRANSFER') ? (
        <div>
          <h5>Chọn phương thức thanh toán</h5>
          
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'online')}
            className="mb-3"
          >
            <Tab eventKey="online" title="💳 Thanh toán online">
              <Form className="mb-3">
                {renderPaymentMethods()}
              </Form>

              {paymentUrl && (
                <Alert variant="info">
                  <Alert.Heading>Chuyển đến trang thanh toán</Alert.Heading>
                  <p>Một cửa sổ mới đã được mở để bạn thực hiện thanh toán. 
                     Nếu cửa sổ không mở, vui lòng <a href={paymentUrl} target="_blank" rel="noopener noreferrer">click vào đây</a>.
                  </p>
                </Alert>
              )}

              <div className="text-end">
                <Button 
                  variant="primary" 
                  onClick={handleCreatePayment}
                  disabled={loading || !selectedMethod}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-credit-card me-2"></i>
                      Thanh toán online
                    </>
                  )}
                </Button>
              </div>
            </Tab>

            <Tab eventKey="qr" title="📱 Quét QR chuyển khoản">
              {renderQRPayment()}
            </Tab>
          </Tabs>
        </div>
      ) : (
        <div className="text-center">
          {currentPayment.status === 'SUCCESS' || currentPayment.status === 'COMPLETED' ? (
            <div className="text-success">
              <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
              <h4 className="mt-2">Thanh toán thành công!</h4>
            </div>
          ) : currentPayment.status === 'FAILED' ? (
            <div className="text-danger">
              <i className="bi bi-x-circle-fill" style={{ fontSize: '3rem' }}></i>
              <h4 className="mt-2">Thanh toán thất bại!</h4>
              <Button variant="outline-primary" onClick={() => setCurrentPayment(null)}>
                Thử lại
              </Button>
            </div>
          ) : currentPayment.status === 'PENDING' && currentPayment.paymentMethod === 'BANK_TRANSFER' ? (
            <div className="text-warning">
              <i className="bi bi-clock-fill" style={{ fontSize: '3rem' }}></i>
              <h4 className="mt-2">Đang chờ xác nhận chuyển khoản</h4>
              <p className="text-muted">Chúng tôi sẽ xác nhận thanh toán của bạn trong thời gian sớm nhất.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  if (showModal) {
    return (
      <Modal show={showModal} onHide={onClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-credit-card me-2"></i>
            Thanh toán đặt bàn #{bookingId}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {content}
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>
          <i className="bi bi-credit-card me-2"></i>
          Thanh toán
        </Card.Title>
        {content}
      </Card.Body>
    </Card>
  );
};

export default PaymentComponent;