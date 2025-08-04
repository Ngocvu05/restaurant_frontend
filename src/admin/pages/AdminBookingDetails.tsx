// src/admin/pages/AdminBookingDetailsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert,
  Spinner,
  Badge,
  ButtonGroup,
  Modal
} from 'react-bootstrap';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Users, 
  Clock,
  User,
  MapPin,
  Edit3,
  Plus,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { 
  getAllBookings, 
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking, 
  BookingDTO 
} from '../api/adminBookingApi';

// Form data interface khớp với BookingDTO backend
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

const AdminBookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewBooking = id === 'new';
  
  const [loading, setLoading] = useState(!isNewBooking);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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
      
      // Sử dụng API getBookingById
      const booking = await getBookingById(parseInt(id!));
      
      if (!booking) {
        setError('Không tìm thấy thông tin đặt bàn');
        return;
      }

      // Format datetime cho input datetime-local
      const formatDateTimeForInput = (dateTime?: string) => {
        if (!dateTime) return '';
        const date = new Date(dateTime);
        return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
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
    } catch (error) {
      console.error('Lỗi khi tải thông tin đặt bàn:', error);
      setError('Không thể tải thông tin đặt bàn');
    } finally {
      setLoading(false);
    }
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

      // Format datetime cho backend (ISO string)
      const formatDateTimeForAPI = (dateTime: string) => {
        return new Date(dateTime).toISOString();
      };

      // Create data object for API
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
      } else {
        apiData.id = formData.id;
        result = await updateBooking(formData.id!, apiData);
        alert('Cập nhật đặt bàn thành công!');
      }

      console.log('Kết quả:', result);
      navigate('/admin/bookings');
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
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <MapPin size={16} />
                      </span>
                      <Form.Control
                        type="number"
                        value={formData.tableId}
                        onChange={(e) => handleInputChange('tableId', parseInt(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-medium">
                      Thời gian đặt bàn <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <Clock size={16} />
                      </span>
                      <Form.Control
                        type="datetime-local"
                        value={formData.bookingTime}
                        onChange={(e) => handleInputChange('bookingTime', e.target.value)}
                        required
                      />
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-medium">
                      Số người <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <Users size={16} />
                      </span>
                      <Form.Control
                        type="number"
                        value={formData.numberOfGuests}
                        onChange={(e) => handleInputChange('numberOfGuests', parseInt(e.target.value))}
                        min="1"
                        max="20"
                        required
                      />
                    </div>
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
                    <div className="input-group">
                      <span className="input-group-text bg-light">₫</span>
                      <Form.Control
                        type="number"
                        value={formData.totalAmount || 0}
                        onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1000"
                      />
                    </div>
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
                <div className="mt-4 pt-3 border-top">
                  <small className="text-muted">
                    <strong>Được tạo:</strong> {formData.bookingTime}<br/>
                    <strong>ID:</strong> #{formData.id}
                  </small>
                </div>
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
    </Container>
  );
};

export default AdminBookingDetailsPage;