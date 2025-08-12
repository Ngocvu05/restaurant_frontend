// src/admin/pages/AdminBookingDetailsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, Modal, Table, InputGroup } from 'react-bootstrap';
import { 
  ArrowLeft, Save, Calendar, Users, Clock, User, MapPin, Edit3, Plus, Trash2, X, 
  CreditCard, CheckCircle, XCircle, AlertCircle, FileText, DollarSign 
} from 'lucide-react';
import { getAllBookings, getBookingById, createBooking, updateBooking, cancelBooking, BookingDTO } from '../api/adminBookingApi';
import { paymentConfirmationApi, PaymentConfirmationDTO } from '../api/paymentConfirmationApi';

interface BookingFormData {
  id?: number;
  userId?: number;
  username: string;
  tableId: number;
  bookingTime: string;
  numberOfGuests: number;
  note?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  totalAmount?: number;
}

const statusOptions = [
  { value: 'PENDING', label: 'Đang chờ', color: 'warning' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'success' },
  { value: 'CANCELLED', label: 'Đã huỷ', color: 'danger' }
];

const paymentStatusConfig = {
  PENDING: { label: 'Chờ xác nhận', color: 'warning', icon: AlertCircle },
  SUCCESS: { label: 'Đã xác nhận', color: 'success', icon: CheckCircle },
  REJECTED: { label: 'Đã từ chối', color: 'danger', icon: XCircle },
  FAILED: { label: 'Thất bại', color: 'danger', icon: AlertCircle },
  CANCELED: { label: 'Đã huỷ', color: 'secondary', icon: XCircle }
};

const AdminBookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewBooking = id === 'new';
  
  const [loading, setLoading] = useState(!isNewBooking);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Payment confirmation states
  const [paymentConfirmations, setPaymentConfirmations] = useState<PaymentConfirmationDTO[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentConfirmationDTO | null>(null);
  const [adminNote, setAdminNote] = useState('');
  
  const [formData, setFormData] = useState<BookingFormData>({
    username: '',
    tableId: 1,
    bookingTime: '',
    numberOfGuests: 2,
    status: 'PENDING',
    note: '',
    totalAmount: 0
  });

  const [originalData, setOriginalData] = useState<BookingFormData | null>(null);

  const fetchBookingDetails = async () => {
    if (isNewBooking) return;

    try {
      setLoading(true);
      setError(null);
      
      const booking = await getBookingById(parseInt(id!));
      
      if (!booking) {
        setError('Không tìm thấy thông tin đặt bàn');
        return;
      }

      const formatDateTimeForInput = (dateTime?: string) => {
        if (!dateTime) return '';
        const date = new Date(dateTime);
        return date.toISOString().slice(0, 16);
      };

      const bookingData: BookingFormData = {
        id: booking.id,
        userId: booking.userId,
        username: booking.username || '',
        tableId: booking.tableId || 1,
        bookingTime: formatDateTimeForInput(booking.bookingTime),
        numberOfGuests: booking.numberOfGuests || 2,
        status: (booking.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED') || 'PENDING',
        note: booking.note || '',
        totalAmount: booking.totalAmount || 0
      };

      setFormData(bookingData);
      setOriginalData(bookingData);
      
      // Fetch payment confirmations for this booking
      if (booking.id) {
        await fetchPaymentConfirmations(booking.id);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin đặt bàn:', error);
      setError('Không thể tải thông tin đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentConfirmations = async (bookingId: number) => {
    try {
      setLoadingPayments(true);
      const confirmations = await paymentConfirmationApi.getConfirmationsByBooking(bookingId);
      setPaymentConfirmations(confirmations);
    } catch (error) {
      console.error('Lỗi khi tải thông tin xác nhận thanh toán:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handlePaymentAction = async (paymentId: number, action: 'confirm' | 'reject') => {
    if (!adminNote.trim()) {
      setError('Vui lòng nhập ghi chú admin');
      return;
    }

    try {
      setProcessingPayment(paymentId);
      setError(null);

      if (action === 'confirm') {
        await paymentConfirmationApi.confirmPayment(paymentId, adminNote);
      } else {
        await paymentConfirmationApi.rejectPayment(paymentId, adminNote);
      }

      // Refresh payment confirmations
      if (formData.id) {
        await fetchPaymentConfirmations(formData.id);
      }
      
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setAdminNote('');
      
    } catch (error) {
      console.error(`Lỗi khi ${action === 'confirm' ? 'xác nhận' : 'từ chối'} thanh toán:`, error);
      setError(`Không thể ${action === 'confirm' ? 'xác nhận' : 'từ chối'} thanh toán`);
    } finally {
      setProcessingPayment(null);
    }
  };

  const openPaymentModal = (payment: PaymentConfirmationDTO, action: 'confirm' | 'reject') => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
    setAdminNote('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('vi-VN');
  };

  const handleInputChange = (field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username.trim()) {
      setError('Vui lòng nhập tên khách hàng');
      return;
    }
    if (!formData.bookingTime) {
      setError('Vui lòng chọn thời gian đặt bàn');
      return;
    }
    if (formData.numberOfGuests < 1) {
      setError('Số người phải lớn hơn 0');
      return;
    }
    if (!formData.tableId || formData.tableId < 1) {
      setError('Vui lòng chọn số bàn hợp lệ');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const formatDateTimeForAPI = (dateTime: string) => {
        return new Date(dateTime).toISOString();
      };

      const apiData: Partial<BookingDTO> = {
        username: formData.username,
        tableId: formData.tableId,
        bookingTime: formatDateTimeForAPI(formData.bookingTime),
        numberOfGuests: formData.numberOfGuests,
        status: formData.status,
        note: formData.note || undefined,
        totalAmount: formData.totalAmount || 0
      };

      let result: BookingDTO;

      if (isNewBooking) {
        result = await createBooking(apiData);
        alert('Tạo đặt bàn mới thành công!');
        navigate(`/admin/bookings/${result.id}`);
      } else {
        apiData.id = formData.id;
        result = await updateBooking(formData.id!, apiData);
        alert('Cập nhật đặt bàn thành công!');
        // Refresh data
        if (result.id) {
          await fetchBookingDetails();
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      setError('Không thể lưu thông tin. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;

    try {
      await cancelBooking(formData.id);
      setShowDeleteModal(false);
      navigate('/admin/bookings');
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      setError('Không thể xóa đặt bàn');
    }
  };

  const hasChanges = () => {
    if (isNewBooking) return true;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    return statusInfo ? { label: statusInfo.label, color: statusInfo.color } : { label: 'Không rõ', color: 'secondary' };
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0 text-muted">Đang tải thông tin...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/admin/bookings')}
                className="me-3"
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h2 className="mb-1 fw-bold text-dark">
                  {isNewBooking ? (
                    <>
                      <Plus className="me-2" size={28} />
                      Thêm đặt bàn mới
                    </>
                  ) : (
                    <>
                      <Edit3 className="me-2" size={28} />
                      Chi tiết đặt bàn #{formData.id}
                    </>
                  )}
                </h2>
                <p className="text-muted mb-0">
                  {isNewBooking ? 'Tạo đơn đặt bàn mới cho khách hàng' : 'Xem và chỉnh sửa thông tin đặt bàn'}
                </p>
              </div>
            </div>
            
            {!isNewBooking && (
              <div className="d-flex align-items-center gap-2">
                <Badge 
                  bg={getStatusBadge(formData.status).color} 
                  className="px-3 py-2"
                  style={{fontSize: '0.875rem'}}
                >
                  {getStatusBadge(formData.status).label}
                </Badge>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row>
        <Col xl={8}>
          {/* Main Form */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold">
                <User className="me-2" size={20} />
                Thông tin khách hàng
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-medium">
                      Tên khách hàng <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="Nhập tên khách hàng"
                      required
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-medium">
                      Số bàn <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <MapPin size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        value={formData.tableId}
                        onChange={(e) => handleInputChange('tableId', parseInt(e.target.value))}
                        min="1"
                        required
                      />
                    </InputGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-medium">
                      Thời gian đặt bàn <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <Clock size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="datetime-local"
                        value={formData.bookingTime}
                        onChange={(e) => handleInputChange('bookingTime', e.target.value)}
                        required
                      />
                    </InputGroup>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-medium">
                      Số người <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <Users size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        value={formData.numberOfGuests}
                        onChange={(e) => handleInputChange('numberOfGuests', parseInt(e.target.value))}
                        min="1"
                        max="20"
                        required
                      />
                    </InputGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-medium">Trạng thái</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-medium">Tổng tiền</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">₫</InputGroup.Text>
                      <Form.Control
                        type="number"
                        value={formData.totalAmount || 0}
                        onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1000"
                      />
                    </InputGroup>
                  </Col>
                </Row>

                <div className="mb-3">
                  <Form.Label className="fw-medium">Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.note || ''}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    placeholder="Ghi chú thêm về đặt bàn..."
                  />
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Payment Confirmations Section */}
          {!isNewBooking && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0 fw-semibold">
                    <CreditCard className="me-2" size={20} />
                    Xác nhận thanh toán
                  </h5>
                  {loadingPayments && <Spinner size="sm" />}
                </div>
              </Card.Header>
              <Card.Body>
                {paymentConfirmations.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <CreditCard size={48} className="mb-3 opacity-50" />
                    <p className="mb-0">Chưa có yêu cầu xác nhận thanh toán nào</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Số tiền</th>
                          <th>Phương thức</th>
                          <th>Trạng thái</th>
                          <th>Ngày tạo</th>
                          <th>Ghi chú khách hàng</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentConfirmations.map((payment) => {
                          const statusConfig = paymentStatusConfig[payment.status];
                          const StatusIcon = statusConfig.icon;
                          
                          return (
                            <tr key={payment.id}>
                              <td>#{payment.id}</td>
                              <td className="fw-semibold">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td>{payment.paymentMethod || 'N/A'}</td>
                              <td>
                                <Badge bg={statusConfig.color} className="d-flex align-items-center w-fit">
                                  <StatusIcon size={14} className="me-1" />
                                  {statusConfig.label}
                                </Badge>
                              </td>
                              <td>{formatDateTime(payment.createdAt)}</td>
                              <td>
                                <small>{payment.customerNote || 'Không có'}</small>
                              </td>
                              <td>
                                {payment.status === 'PENDING' && (
                                  <div className="d-flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline-success"
                                      onClick={() => openPaymentModal(payment, 'confirm')}
                                      disabled={processingPayment === payment.id}
                                    >
                                      <CheckCircle size={14} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline-danger"
                                      onClick={() => openPaymentModal(payment, 'reject')}
                                      disabled={processingPayment === payment.id}
                                    >
                                      <XCircle size={14} />
                                    </Button>
                                  </div>
                                )}
                                {payment.status !== 'PENDING' && (
                                  <small className="text-muted">
                                    Đã xử lý bởi: {payment.processedBy}<br/>
                                    {formatDateTime(payment.processedAt)}
                                  </small>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col xl={4}>
          {/* Action Panel */}
          <Card className="border-0 shadow-sm sticky-top" style={{top: '20px'}}>
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold">Hành động</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={saving || !hasChanges()}
                  className="d-flex align-items-center justify-content-center"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="me-2" />
                      {isNewBooking ? 'Tạo đặt bàn' : 'Lưu thay đổi'}
                    </>
                  )}
                </Button>

                {!isNewBooking && formData.status !== 'CANCELLED' && (
                  <Button
                    variant="outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <X size={16} className="me-2" />
                    Huỷ đặt bàn
                  </Button>
                )}

                <Button
                  variant="outline-secondary"
                  onClick={() => navigate('/admin/bookings')}
                  className="d-flex align-items-center justify-content-center"
                >
                  <ArrowLeft size={16} className="me-2" />
                  Quay lại
                </Button>
              </div>

              {!isNewBooking && (
                <>
                  <hr className="my-4" />
                  <div className="text-muted small">
                    <div className="d-flex justify-content-between mb-2">
                      <span>ID:</span>
                      <span>#{formData.id}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tổng tiền:</span>
                      <span className="fw-semibold text-primary">
                        {formatCurrency(formData.totalAmount || 0)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Xác nhận thanh toán:</span>
                      <span>
                        {paymentConfirmations.filter(p => p.status === 'SUCCESS').length}/
                        {paymentConfirmations.length}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận huỷ đặt bàn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                 style={{width: '64px', height: '64px'}}>
              <Trash2 className="text-danger" size={24} />
            </div>
            <h5>Bạn có chắc chắn muốn huỷ đặt bàn này?</h5>
            <p className="text-muted mb-0">
              Đặt bàn cho khách hàng <strong>{formData.username}</strong> sẽ bị huỷ.
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
            Không, giữ lại
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} className="me-2" />
            Có, huỷ đặt bàn
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Action Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedPayment && (
              <>
                {processingPayment ? 'Xác nhận' : 'Từ chối'} thanh toán #{selectedPayment.id}
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <>
              <div className="mb-3">
                <h6>Thông tin thanh toán:</h6>
                <ul className="list-unstyled">
                  <li><strong>Số tiền:</strong> {formatCurrency(selectedPayment.amount)}</li>
                  <li><strong>Phương thức:</strong> {selectedPayment.paymentMethod || 'N/A'}</li>
                  <li><strong>Mã giao dịch:</strong> {selectedPayment.transactionReference || 'N/A'}</li>
                  <li><strong>Ghi chú KH:</strong> {selectedPayment.customerNote || 'Không có'}</li>
                </ul>
              </div>
              
              <Form.Group>
                <Form.Label className="fw-medium">
                  Ghi chú admin <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập ghi chú về quyết định này..."
                  required
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowPaymentModal(false)}
            disabled={processingPayment !== null}
          >
            Hủy
          </Button>
          <Button 
            variant="success" 
            onClick={() => handlePaymentAction(selectedPayment!.id, 'confirm')}
            disabled={processingPayment !== null || !adminNote.trim()}
          >
            {processingPayment === selectedPayment?.id ? (
              <Spinner size="sm" className="me-2" />
            ) : (
              <CheckCircle size={16} className="me-2" />
            )}
            Xác nhận
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handlePaymentAction(selectedPayment!.id, 'reject')}
            disabled={processingPayment !== null || !adminNote.trim()}
          >
            {processingPayment === selectedPayment?.id ? (
              <Spinner size="sm" className="me-2" />
            ) : (
              <XCircle size={16} className="me-2" />
            )}
            Từ chối
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminBookingDetailsPage;