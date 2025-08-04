// src/admin/pages/AdminBookingPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Badge, 
  Spinner, 
  Alert,
  InputGroup,
  Form,
  ButtonGroup,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { 
  Search, 
  Eye, 
  XCircle, 
  Calendar, 
  Users, 
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';
import { getAllBookings, cancelBooking, BookingDTO } from '../api/adminBookingApi';

const statusLabel = (status?: string): string => {
  switch (status) {
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'PENDING':
      return 'Đang chờ';
    case 'CANCELLED':
      return 'Đã huỷ';
    default:
      return 'Không rõ';
  }
};

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
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllBookings();
      setBookings(res);
      setFilteredBookings(res);
    } catch (error) {
      console.error('Lỗi khi tải danh sách đặt bàn:', error);
      setError('Không thể tải danh sách đặt bàn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn huỷ đặt bàn này không?')) return;
    
    try {
      await cancelBooking(id);
      await fetchBookings();
    } catch (err) {
      alert('Huỷ thất bại. Vui lòng thử lại.');
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterBookings(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterBookings(searchTerm, status);
  };

  const filterBookings = (search: string, status: string) => {
    let filtered = bookings;

    // Filter by search term
    if (search) {
      filtered = filtered.filter(booking => 
        booking.username?.toLowerCase().includes(search.toLowerCase()) ||
        booking.tableId?.toString().includes(search) ||
        booking.id?.toString().includes(search)
      );
    }

    // Filter by status
    if (status !== 'ALL') {
      filtered = filtered.filter(booking => booking.status === status);
    }

    setFilteredBookings(filtered);
  };

  const getStatsData = () => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
    const pending = bookings.filter(b => b.status === 'PENDING').length;
    const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;
    
    return { total, confirmed, pending, cancelled };
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const stats = getStatsData();

  return (
    <Container fluid className="py-4">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold text-dark">
                <Calendar className="me-2" size={28} />
                Quản lý đặt bàn
              </h2>
              <p className="text-muted mb-0">Theo dõi và quản lý tất cả đơn đặt bàn</p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
                onClick={fetchBookings}
                disabled={loading}
                className="d-flex align-items-center"
              >
                <RefreshCw size={16} className="me-2" />
                Làm mới
              </Button>
              <Button 
                variant="primary" 
                href="/admin/bookings/new"
                className="d-flex align-items-center"
              >
                <Calendar size={16} className="me-2" />
                Thêm đặt bàn mới
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                <Calendar className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.total}</h3>
                <p className="text-muted mb-0 small">Tổng đặt bàn</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 rounded-3 p-3 me-3">
                <Clock className="text-success" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold text-success">{stats.confirmed}</h3>
                <p className="text-muted mb-0 small">Đã xác nhận</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 rounded-3 p-3 me-3">
                <Users className="text-warning" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold text-warning">{stats.pending}</h3>
                <p className="text-muted mb-0 small">Đang chờ</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-danger bg-opacity-10 rounded-3 p-3 me-3">
                <XCircle className="text-danger" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold text-danger">{stats.cancelled}</h3>
                <p className="text-muted mb-0 small">Đã huỷ</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên khách hàng, số bàn..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="CANCELLED">Đã huỷ</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <small className="text-muted">
                Hiển thị {filteredBookings.length} / {bookings.length} đặt bàn
              </small>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {error && (
            <Alert variant="danger" className="m-3">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 mb-0 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-5">
              <Calendar size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Không có đặt bàn nào</h5>
              <p className="text-muted mb-0">
                {searchTerm || statusFilter !== 'ALL' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có đơn đặt bàn nào'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table className="mb-0" hover>
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 fw-semibold text-muted small">#</th>
                    <th className="border-0 fw-semibold text-muted small">KHÁCH HÀNG</th>
                    <th className="border-0 fw-semibold text-muted small">BÀN</th>
                    <th className="border-0 fw-semibold text-muted small">THỜI GIAN</th>
                    <th className="border-0 fw-semibold text-muted small">SỐ NGƯỜI</th>
                    <th className="border-0 fw-semibold text-muted small">TRẠNG THÁI</th>
                    <th className="border-0 fw-semibold text-muted small text-center">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, index) => {
                    const status = statusLabel(booking.status);
                    return (
                      <tr key={booking.id ?? index} className="align-middle">
                        <td className="fw-medium text-muted">
                          #{bookings.findIndex(b => b.id === booking.id) + 1}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
                                 style={{width: '40px', height: '40px'}}>
                              <span className="text-primary fw-bold">
                                {booking.username?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div>
                              <div className="fw-medium">{booking.username || 'Không rõ'}</div>
                              <small className="text-muted">ID: {booking.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            Bàn {booking.tableId || '---'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Clock size={16} className="text-muted me-2" />
                            <span>{booking.bookingTime}</span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Users size={16} className="text-muted me-2" />
                            <span>{booking.numberOfGuests || 0} người</span>
                          </div>
                        </td>
                        <td>
                          <Badge 
                            bg={statusColor(status)} 
                            className="px-3 py-2"
                            style={{fontSize: '0.75rem'}}
                          >
                            {status}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Xem chi tiết</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-primary"
                                href={`/admin/bookings/${booking.id ?? ''}`}
                                className="d-flex align-items-center"
                              >
                                <Eye size={14} />
                              </Button>
                            </OverlayTrigger>
                            
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Huỷ đặt bàn</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleCancel(booking.id)}
                                disabled={booking.status === 'CANCELLED'}
                                className="d-flex align-items-center"
                              >
                                <XCircle size={14} />
                              </Button>
                            </OverlayTrigger>
                          </div>
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
    </Container>
  );
};

export default AdminBookingPage;