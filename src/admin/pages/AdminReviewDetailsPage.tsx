import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, Breadcrumb} from 'react-bootstrap';
import { ArrowLeft, Star, CheckCircle, XCircle, User, Eye} from 'lucide-react';
import { getReviewById, verifyReview, deleteReview, ReviewDTO } from '../../api/reviewApi';

const statusLabel = (isActive?: boolean): string =>
  isActive ? 'Hiển thị' : 'Ẩn';

const statusColor = (isActive?: boolean): string =>
  isActive ? 'success' : 'secondary';

const AdminReviewDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<ReviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getReviewById(Number(id));
      setReview(res);
    } catch (err) {
      setError('Không thể tải thông tin đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
    // eslint-disable-next-line
  }, [id]);

  const handleApprove = async () => {
    if (!review?.id) return;
    if (!window.confirm('Duyệt và hiển thị đánh giá này?')) return;
    try {
      setActionLoading(true);
      await verifyReview(review.id);
      await fetchReview();
    } catch {
      alert('Duyệt đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!review?.id) return;
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      setActionLoading(true);
      await deleteReview(review.id);
      navigate('/admin/reviews', {
        state: { message: 'Đã xoá đánh giá thành công!' }
      });
    } catch {
      alert('Xoá đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoBack = () => navigate('/admin/reviews');

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0 text-muted">Đang tải dữ liệu...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Breadcrumb */}
      <Row className="mb-4">
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item href="/admin">Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item href="/admin/reviews">Quản lý đánh giá</Breadcrumb.Item>
            <Breadcrumb.Item active>Chi tiết đánh giá</Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              onClick={handleGoBack}
              className="me-3 d-flex align-items-center"
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h2 className="mb-1 fw-bold text-dark">
                <Eye className="me-2" size={28} />
                Chi tiết đánh giá #{review?.id}
              </h2>
              <p className="text-muted mb-0">
                Thông tin chi tiết và xử lý đánh giá món ăn
              </p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" className="d-flex align-items-center">
              <XCircle size={20} className="me-2" />
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold">
                <User size={20} className="me-2" />
                Khách hàng & Món ăn
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={5} className="mb-4">
                  <div className="d-flex align-items-center">
                    <img
                      src={review?.customerAvatar || '/default-avatar.png'}
                      alt={review?.customerName}
                      width={56}
                      height={56}
                      className="rounded-circle me-3"
                      style={{ objectFit: 'cover' }}
                    />
                    <div>
                      <div className="fw-bold">{review?.customerName || 'Ẩn danh'}</div>
                      <div className="text-muted small">ID: {review?.customerId}</div>
                    </div>
                  </div>
                </Col>
                <Col md={7}>
                  <div>
                    <span className="fw-medium">Món ăn:&nbsp;</span>
                    <Badge bg="info" className="fs-6">
                      {review?.dishName || `#${review?.dishId}`}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <span className="fw-medium">Ngày đánh giá:&nbsp;</span>
                    <span className="text-muted">
                      {review?.createdAt && new Date(review.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold">
                <Star size={20} className="me-2" />
                Nội dung đánh giá
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Badge bg="warning" text="dark" className="me-2 px-2 py-1 fs-6">
                  <Star size={15} className="me-1" />
                  {review?.rating}/5
                </Badge>
                {review?.isVerified && (
                  <Badge bg="success" className="ms-1">
                    <CheckCircle size={14} className="me-1" />
                    Đã duyệt
                  </Badge>
                )}
                <Badge
                  bg={statusColor(review?.isActive)}
                  className="ms-2 px-3 py-2"
                  style={{ fontSize: '0.90rem' }}
                >
                  {statusLabel(review?.isActive)}
                </Badge>
              </div>
              <Form.Group>
                <Form.Label className="fw-medium">Nội dung nhận xét</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={review?.comment || ''}
                  disabled
                  style={{ background: '#f8f9fa', fontSize: '1.1rem', color: '#333' }}
                />
              </Form.Group>
            </Card.Body>
          </Card>

          <div className="d-flex gap-3 pt-2">
            {!review?.isVerified && (
              <Button
                variant="success"
                onClick={handleApprove}
                disabled={actionLoading}
                className="d-flex align-items-center"
              >
                {actionLoading ? (
                  <Spinner size="sm" className="me-2" />
                ) : (
                  <CheckCircle size={16} className="me-2" />
                )}
                Duyệt đánh giá
              </Button>
            )}
            <Button
              variant="outline-danger"
              onClick={handleDelete}
              disabled={actionLoading}
              className="d-flex align-items-center"
            >
              <XCircle size={16} className="me-2" />
              Xóa đánh giá
            </Button>
            <Button
              variant="secondary"
              onClick={handleGoBack}
              className="ms-auto"
              disabled={actionLoading}
            >
              Quay lại
            </Button>
          </div>
        </Col>

        <Col lg={4}>
          {/* Card hiển thị meta hoặc tips nếu cần */}
          <Card className="border-0 shadow-sm bg-light mb-4">
            <Card.Body>
              <h6 className="fw-semibold mb-3">ℹ️ Thông tin thêm</h6>
              <ul className="small text-muted mb-0 ps-3">
                <li><span className="fw-medium">ID đánh giá:</span> {review?.id}</li>
                <li><span className="fw-medium">Tên khách hàng:</span> {review?.customerName}</li>
                <li><span className="fw-medium">ID món ăn:</span> {review?.dishId}</li>
                <li><span className="fw-medium">Ngày tạo:</span> {review?.createdAt && new Date(review.createdAt).toLocaleString('vi-VN')}</li>
                <li><span className="fw-medium">Trạng thái:</span> {statusLabel(review?.isActive)}</li>
                <li><span className="fw-medium">Đã duyệt:</span> {review?.isVerified ? 'Có' : 'Chưa'}</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminReviewDetailsPage;
