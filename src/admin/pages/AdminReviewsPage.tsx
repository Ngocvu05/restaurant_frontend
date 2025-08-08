import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, InputGroup, Form, OverlayTrigger, Tooltip, ButtonGroup
} from 'react-bootstrap';
import {
  Search, Eye, XCircle, Star, CheckCircle, RefreshCw, User
} from 'lucide-react';
import { getAllReviews, verifyReview, deleteReview, ReviewDTO } from '../../api/reviewApi';

const statusLabel = (isActive?: boolean): string =>
  isActive ? 'Hiển thị' : 'Ẩn';

const statusColor = (isActive?: boolean): string =>
  isActive ? 'success' : 'secondary';

const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllReviews();
      setReviews(res.reviews);
      setFilteredReviews(res.reviews);
    } catch (error) {
      setError('Không thể tải danh sách đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Duyệt và hiển thị đánh giá này?')) return;
    try {
      await verifyReview(id);
      await fetchReviews();
    } catch {
      alert('Duyệt đánh giá thất bại. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await deleteReview(id);
      await fetchReviews();
    } catch {
      alert('Xoá thất bại. Vui lòng thử lại.');
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterReviews(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterReviews(searchTerm, status);
  };

  const filterReviews = (search: string, status: string) => {
    let filtered = reviews;

    // Filter by search
    if (search) {
      filtered = filtered.filter(r =>
        r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        r.dishName?.toLowerCase().includes(search.toLowerCase()) ||
        r.comment?.toLowerCase().includes(search.toLowerCase()) ||
        r.id?.toString().includes(search)
      );
    }
    // Filter by status
    if (status !== 'ALL') {
      filtered = filtered.filter(r => {
        if (status === 'HIEN_THI') return r.isActive;
        if (status === 'AN') return !r.isActive;
        if (status === 'CHUA_DUYET') return !r.isVerified;
        if (status === 'DA_DUYET') return r.isVerified;
        return true;
      });
    }
    setFilteredReviews(filtered);
  };

  // Thống kê tổng, số hiển thị, số ẩn, số đã duyệt
  const getStats = () => {
    const total = reviews.length;
    const active = reviews.filter(r => r.isActive).length;
    const hidden = reviews.filter(r => !r.isActive).length;
    const verified = reviews.filter(r => r.isVerified).length;
    return { total, active, hidden, verified };
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const stats = getStats();

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold text-dark">
                <Star className="me-2" size={28} />
                Quản lý đánh giá
              </h2>
              <p className="text-muted mb-0">Theo dõi, duyệt và quản lý các đánh giá món ăn</p>
            </div>
            <Button
              variant="outline-primary"
              onClick={fetchReviews}
              disabled={loading}
              className="d-flex align-items-center"
            >
              <RefreshCw size={16} className="me-2" />
              Làm mới
            </Button>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                <Star className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.total}</h3>
                <p className="text-muted mb-0 small">Tổng đánh giá</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 rounded-3 p-3 me-3">
                <CheckCircle className="text-success" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold text-success">{stats.verified}</h3>
                <p className="text-muted mb-0 small">Đã duyệt</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-secondary bg-opacity-10 rounded-3 p-3 me-3">
                <XCircle className="text-secondary" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold text-secondary">{stats.hidden}</h3>
                <p className="text-muted mb-0 small">Bị ẩn</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 rounded-3 p-3 me-3">
                <User className="text-info" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold text-info">{stats.active}</h3>
                <p className="text-muted mb-0 small">Đang hiển thị</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter, search */}
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
                  placeholder="Tìm kiếm theo tên khách hàng, món ăn, nhận xét..."
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={statusFilter} onChange={e => handleStatusFilter(e.target.value)}>
                <option value="ALL">Tất cả trạng thái</option>
                <option value="HIEN_THI">Hiển thị</option>
                <option value="AN">Bị ẩn</option>
                <option value="DA_DUYET">Đã duyệt</option>
                <option value="CHUA_DUYET">Chưa duyệt</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <small className="text-muted">
                Hiển thị {filteredReviews.length} / {reviews.length} đánh giá
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
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-5">
              <Star size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Không có đánh giá nào</h5>
              <p className="text-muted mb-0">
                {searchTerm || statusFilter !== 'ALL' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có đánh giá nào'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table className="mb-0" hover>
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 fw-semibold text-muted small">#</th>
                    <th className="border-0 fw-semibold text-muted small">KHÁCH HÀNG</th>
                    <th className="border-0 fw-semibold text-muted small">MÓN ĂN</th>
                    <th className="border-0 fw-semibold text-muted small">ĐÁNH GIÁ</th>
                    <th className="border-0 fw-semibold text-muted small">NHẬN XÉT</th>
                    <th className="border-0 fw-semibold text-muted small">NGÀY TẠO</th>
                    <th className="border-0 fw-semibold text-muted small">TRẠNG THÁI</th>
                    <th className="border-0 fw-semibold text-muted small text-center">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review, index) => (
                    <tr key={review.id ?? index} className="align-middle">
                      <td className="fw-medium text-muted">#{reviews.findIndex(r => r.id === review.id) + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={review.customerAvatar || '/default-avatar.png'}
                            alt={review.customerName}
                            width={40}
                            height={40}
                            className="rounded-circle me-2"
                            style={{ objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-medium">{review.customerName || 'Ẩn danh'}</div>
                            <small className="text-muted">ID: {review.customerId}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info text-white">{review.dishName || `#${review.dishId}`}</span>
                      </td>
                      <td>
                        <Badge bg="warning" text="dark" className="px-2 py-1">
                          <Star size={14} className="me-1" />
                          {review.rating}/5
                        </Badge>
                        {review.isVerified && (
                          <Badge bg="success" className="ms-1">
                            <CheckCircle size={12} className="me-1" />
                            Đã duyệt
                          </Badge>
                        )}
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: 180 }}>
                          {review.comment}
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">
                          {review.createdAt && new Date(review.createdAt).toLocaleString('vi-VN')}
                        </small>
                      </td>
                      <td>
                        <Badge
                          bg={statusColor(review.isActive)}
                          className="px-3 py-2"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {statusLabel(review.isActive)}
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
                              href={`/admin/reviews/${review.id ?? ''}`}
                              className="d-flex align-items-center"
                            >
                              <Eye size={14} />
                            </Button>
                          </OverlayTrigger>
                          {!review.isVerified && (
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Duyệt đánh giá</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => review.id !== undefined && handleApprove(review.id)}
                                className="d-flex align-items-center"
                              >
                                <CheckCircle size={14} />
                              </Button>
                            </OverlayTrigger>
                          )}
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Xóa đánh giá</Tooltip>}
                          >
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => review.id !== undefined && handleDelete(review.id)}
                              className="d-flex align-items-center"
                            >
                              <XCircle size={14} />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminReviewsPage;