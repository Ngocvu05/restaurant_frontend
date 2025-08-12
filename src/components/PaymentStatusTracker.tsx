// src/components/PaymentStatusTracker.tsx
import React, { useEffect, useState } from 'react';
import { Alert, Badge, Spinner, Card } from 'react-bootstrap';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import moment from 'moment';
import { paymentConfirmationApi, PaymentConfirmationDTO } from '../admin/api/paymentConfirmationApi';

interface PaymentStatusTrackerProps {
  bookingId: number;
  onStatusChange?: (status: PaymentConfirmationDTO | null) => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

const PaymentStatusTracker: React.FC<PaymentStatusTrackerProps> = ({
  bookingId,
  onStatusChange,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [confirmation, setConfirmation] = useState<PaymentConfirmationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfirmationStatus = async () => {
    try {
      setError(null);
      const result = await paymentConfirmationApi.getConfirmationStatus(bookingId);
      setConfirmation(result);
      
      if (onStatusChange) {
        onStatusChange(result);
      }
    } catch (error: any) {
      setError(error.message);
      setConfirmation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmationStatus();

    if (autoRefresh && confirmation?.status === 'PENDING') {
      const interval = setInterval(fetchConfirmationStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [bookingId, autoRefresh, refreshInterval, confirmation?.status]);

  const getStatusDisplay = () => {
    if (!confirmation) return null;

    switch (confirmation.status) {
      case 'PENDING':
        return {
          variant: 'warning' as const,
          icon: <Clock size={16} className="me-2" />,
          title: 'Đang chờ xác nhận',
          description: 'Yêu cầu xác nhận thanh toán đã được gửi. Vui lòng chờ nhân viên xác nhận.',
          showSpinner: true
        };
      case 'SUCCESS':
        return {
          variant: 'success' as const,
          icon: <CheckCircle size={16} className="me-2" />,
          title: 'Thanh toán đã được xác nhận',
          description: 'Thanh toán của bạn đã được xác nhận thành công.',
          showSpinner: false
        };
      case 'REJECTED':
        return {
          variant: 'danger' as const,
          icon: <XCircle size={16} className="me-2" />,
          title: 'Thanh toán bị từ chối',
          description: 'Thanh toán của bạn đã bị từ chối. Vui lòng liên hệ nhà hàng để biết thêm chi tiết.',
          showSpinner: false
        };
      default:
        return {
          variant: 'info' as const,
          icon: <AlertTriangle size={16} className="me-2" />,
          title: 'Trạng thái không xác định',
          description: 'Trạng thái thanh toán không rõ ràng.',
          showSpinner: false
        };
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('DD/MM/YYYY HH:mm:ss');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="warning" text="dark">Đang chờ</Badge>;
      case 'CONFIRMED':
        return <Badge bg="success">Đã xác nhận</Badge>;
      case 'REJECTED':
        return <Badge bg="danger">Bị từ chối</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Đang kiểm tra trạng thái thanh toán...</span>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="warning">
        <AlertTriangle size={16} className="me-2" />
        <strong>Không thể kiểm tra trạng thái:</strong> {error}
      </Alert>
    );
  }

  if (!confirmation) {
    return null; // Chưa có yêu cầu xác nhận nào
  }

  const statusDisplay = getStatusDisplay();
  if (!statusDisplay) return null;

  return (
    <Alert variant={statusDisplay.variant} className="mb-3">
      <div className="d-flex align-items-start">
        <div className="me-3">
          {statusDisplay.showSpinner ? (
            <Spinner animation="border" size="sm" />
          ) : (
            statusDisplay.icon
          )}
        </div>
        <div className="flex-grow-1">
          <Alert.Heading className="h6 mb-2">
            {statusDisplay.title}
          </Alert.Heading>
          <p className="mb-2">
            {statusDisplay.description}
          </p>
          
          <div className="small text-muted">
            <div className="row">
              <div className="col-md-6">
                <strong>Mã giao dịch:</strong> 
                <code className="ms-1">{confirmation.transactionReference}</code>
              </div>
              <div className="col-md-6">
                <strong>Trạng thái:</strong> 
                <span className="ms-1">{getStatusBadge(confirmation.status)}</span>
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <strong>Thời gian tạo yêu cầu:</strong>
                <span className="ms-1">{formatDateTime(confirmation.createdAt)}</span>
              </div>
              {confirmation.processedAt && (
                <div className="col-md-6">
                  <strong>Thời gian xử lý:</strong>
                  <span className="ms-1">{formatDateTime(confirmation.processedAt)}</span>
                </div>
              )}
            </div>
            {confirmation.adminNote && (
              <div className="row mt-2">
                <div className="col-12">
                  <strong>Lý do từ chối:</strong>
                  <span className="ms-1 text-danger">{confirmation.adminNote}</span>
                </div>
              </div>
            )}
            {confirmation.customerNote && (
              <div className="row mt-2">
                <div className="col-12">
                  <strong>Ghi chú khách hàng:</strong>
                  <span className="ms-1">{confirmation.customerNote}</span>
                </div>
              </div>
            )}
            {confirmation.paymentMethod && (
              <div className="row mt-2">
                <div className="col-md-6">
                  <strong>Phương thức thanh toán:</strong>
                  <span className="ms-1">{confirmation.paymentMethod}</span>
                </div>
                {confirmation.amount && (
                  <div className="col-md-6">
                    <strong>Số tiền:</strong>
                    <span className="ms-1 fw-bold">
                      {confirmation.amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Thông tin booking */}
            {(confirmation.customerName || confirmation.tableNumber || confirmation.bookingTime) && (
              <>
                <div className="row mt-3 pt-2 border-top">
                  <div className="col-12">
                    <strong className="text-primary">Thông tin đặt bàn:</strong>
                  </div>
                </div>
                <div className="row mt-2">
                  {confirmation.customerName && (
                    <div className="col-md-6">
                      <strong>Tên khách hàng:</strong>
                      <span className="ms-1">{confirmation.customerName}</span>
                    </div>
                  )}
                  {confirmation.tableNumber && (
                    <div className="col-md-6">
                      <strong>Số bàn:</strong>
                      <span className="ms-1">{confirmation.tableNumber}</span>
                    </div>
                  )}
                </div>
                {(confirmation.bookingTime || confirmation.bookingStatus) && (
                  <div className="row mt-2">
                    {confirmation.bookingTime && (
                      <div className="col-md-6">
                        <strong>Thời gian đặt:</strong>
                        <span className="ms-1">{formatDateTime(confirmation.bookingTime)}</span>
                      </div>
                    )}
                    {confirmation.bookingStatus && (
                      <div className="col-md-6">
                        <strong>Trạng thái booking:</strong>
                        <span className="ms-1">
                          <Badge 
                            bg={confirmation.bookingStatus === 'CONFIRMED' ? 'success' : 
                                confirmation.bookingStatus === 'CANCELLED' ? 'danger' : 'secondary'}
                          >
                            {confirmation.bookingStatus}
                          </Badge>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Thông tin xử lý */}
            {confirmation.processedBy && (
              <div className="row mt-2">
                <div className="col-md-6">
                  <strong>Được xử lý bởi:</strong>
                  <span className="ms-1">{confirmation.processedBy}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Auto refresh indicator */}
          {autoRefresh && confirmation.status === 'PENDING' && (
            <div className="mt-3 pt-2 border-top">
              <small className="text-muted d-flex align-items-center">
                <Spinner animation="border" size="sm" className="me-2" style={{ width: '12px', height: '12px' }} />
                Tự động kiểm tra mỗi {refreshInterval / 1000} giây
              </small>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default PaymentStatusTracker;