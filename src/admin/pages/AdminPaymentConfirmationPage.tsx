// src/admin/pages/AdminPaymentConfirmationPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Badge, Modal, Form, Tab, Tabs, ButtonGroup } from 'react-bootstrap';
import { CreditCard, Clock, CheckCircle, XCircle, Eye, MessageSquare, RefreshCw, Filter } from 'lucide-react';
import moment from 'moment';
import { paymentConfirmationApi, PaymentConfirmationDTO, AdminConfirmationRequest } from '../api/paymentConfirmationApi';

const AdminPaymentConfirmationPage: React.FC = () => {
  const [confirmations, setConfirmations] = useState<PaymentConfirmationDTO[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedConfirmation, setSelectedConfirmation] = useState<PaymentConfirmationDTO | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Load data
  const loadConfirmations = async (status: string = 'PENDING') => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentConfirmationApi.getConfirmationsByStatus(status);
      setConfirmations(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await paymentConfirmationApi.getConfirmationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadConfirmations(activeTab.toUpperCase());
    loadStats();
  }, [activeTab]);

  // Handle actions
  const handleViewDetail = (confirmation: PaymentConfirmationDTO) => {
    setSelectedConfirmation(confirmation);
    setShowDetailModal(true);
  };

  const handleConfirmPayment = (confirmation: PaymentConfirmationDTO) => {
    setSelectedConfirmation(confirmation);
    setAdminNote('');
    setShowConfirmModal(true);
  };

  const handleRejectPayment = (confirmation: PaymentConfirmationDTO) => {
    setSelectedConfirmation(confirmation);
    setAdminNote('');
    setShowRejectModal(true);
  };

  const processConfirmation = async (action: 'confirm' | 'reject') => {
    if (!selectedConfirmation) return;
    
    try {
      setProcessing(selectedConfirmation.id);
      setError(null);

      if (action === 'confirm') {
        await paymentConfirmationApi.confirmPayment(selectedConfirmation.id, adminNote);
        setSuccess('Đã xác nhận thanh toán thành công!');
        setShowConfirmModal(false);
      } else {
        await paymentConfirmationApi.rejectPayment(selectedConfirmation.id, adminNote);
        setSuccess('Đã từ chối thanh toán!');
        setShowRejectModal(false);
      }

      // Refresh data
      await loadConfirmations(activeTab.toUpperCase());
      await loadStats();
      
      setSelectedConfirmation(null);
      setAdminNote('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge bg="warning"><Clock size={12} className="me-1"/>Chờ xác nhận</Badge>;
      case 'confirmed':
        return <Badge bg="success"><CheckCircle size={12} className="me-1"/>Đã xác nhận</Badge>;
      case 'rejected':
        return <Badge bg="danger"><XCircle size={12} className="me-1"/>Đã từ chối</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h2 className="mb-1 fw-bold">
                <CreditCard className="me-2" size={28} />
                Xác nhận thanh toán
              </h2>
              <p className="text-muted mb-0">
                Quản lý các yêu cầu xác nhận thanh toán từ khách hàng
              </p>
            </div>
            <Button
              variant="outline-primary"
              onClick={() => {
                loadConfirmations(activeTab.toUpperCase());
                loadStats();
              }}
              disabled={loading}
            >
              <RefreshCw size={16} className="me-2" />
              Làm mới
            </Button>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning mb-2">
                <Clock size={24} />
              </div>
              <h4 className="fw-bold text-warning">{stats.pending || 0}</h4>
              <small className="text-muted">Chờ xác nhận</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success mb-2">
                <CheckCircle size={24} />
              </div>
              <h4 className="fw-bold text-success">{stats.confirmed || 0}</h4>
              <small className="text-muted">Đã xác nhận</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-danger mb-2">
                <XCircle size={24} />
              </div>
              <h4 className="fw-bold text-danger">{stats.rejected || 0}</h4>
              <small className="text-muted">Đã từ chối</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-info mb-2">
                <CreditCard size={24} />
              </div>
              <h4 className="fw-bold text-info">{stats.total || 0}</h4>
              <small className="text-muted">Tổng cộng</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Main Content */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'pending')}
            className="mb-3"
          >
            <Tab eventKey="pending" title={`Chờ xác nhận (${stats.pending || 0})`}>
              {/* Pending confirmations content */}
            </Tab>
            <Tab eventKey="confirmed" title={`Đã xác nhận (${stats.confirmed || 0})`}>
              {/* Confirmed confirmations content */}
            </Tab>
            <Tab eventKey="rejected" title={`Đã từ chối (${stats.rejected || 0})`}>
              {/* Rejected confirmations content */}
            </Tab>
          </Tabs>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 mb-0 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : confirmations.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted mb-3">
                <CreditCard size={48} />
              </div>
              <h5>Không có yêu cầu nào</h5>
              <p className="text-muted">Chưa có yêu cầu xác nhận thanh toán nào trong trạng thái này.</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Booking</th>
                  <th>Khách hàng</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Mã GD</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {confirmations.map((confirmation) => (
                  <tr key={confirmation.id}>
                    <td>
                      <div>
                        <strong>#{confirmation.bookingId}</strong>
                        {confirmation.tableNumber && (
                          <div className="small text-muted">
                            Bàn {confirmation.tableNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{confirmation.customerName || 'N/A'}</strong>
                        {confirmation.bookingTime && (
                          <div className="small text-muted">
                            {moment(confirmation.bookingTime).format('DD/MM/YYYY HH:mm')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong className="text-primary">
                        {formatCurrency(confirmation.amount)}
                      </strong>
                    </td>
                    <td>
                      <Badge bg="info">
                        {confirmation.paymentMethod}
                      </Badge>
                    </td>
                    <td>
                      <code className="small">
                        {confirmation.transactionReference || 'N/A'}
                      </code>
                    </td>
                    <td>
                      <div className="small">
                        <div>{moment(confirmation.createdAt).format('DD/MM/YYYY')}</div>
                        <div className="text-muted">
                          {moment(confirmation.createdAt).format('HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td>{getStatusBadge(confirmation.status)}</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-info"
                          onClick={() => handleViewDetail(confirmation)}
                        >
                          <Eye size={12} />
                        </Button>
                        {confirmation.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline-success"
                              onClick={() => handleConfirmPayment(confirmation)}
                              disabled={processing === confirmation.id}
                            >
                              <CheckCircle size={12} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={() => handleRejectPayment(confirmation)}
                              disabled={processing === confirmation.id}
                            >
                              <XCircle size={12} />
                            </Button>
                          </>
                        )}
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Eye className="me-2" size={20} />
            Chi tiết xác nhận thanh toán
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedConfirmation && (
            <div>
              <Row>
                <Col md={6}>
                  <h6>Thông tin booking</h6>
                  <p><strong>Booking ID:</strong> #{selectedConfirmation.bookingId}</p>
                  <p><strong>Khách hàng:</strong> {selectedConfirmation.customerName}</p>
                  <p><strong>Bàn:</strong> {selectedConfirmation.tableNumber}</p>
                  <p><strong>Thời gian đặt:</strong> {moment(selectedConfirmation.bookingTime).format('DD/MM/YYYY HH:mm')}</p>
                </Col>
                <Col md={6}>
                  <h6>Thông tin thanh toán</h6>
                  <p><strong>Số tiền:</strong> {formatCurrency(selectedConfirmation.amount)}</p>
                  <p><strong>Phương thức:</strong> {selectedConfirmation.paymentMethod}</p>
                  <p><strong>Mã giao dịch:</strong> <code>{selectedConfirmation.transactionReference}</code></p>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedConfirmation.status)}</p>
                </Col>
              </Row>
              
              {selectedConfirmation.customerNote && (
                <div className="mt-3">
                  <h6>Ghi chú khách hàng</h6>
                  <div className="bg-light p-3 rounded">
                    {selectedConfirmation.customerNote}
                  </div>
                </div>
              )}

              {selectedConfirmation.adminNote && (
                <div className="mt-3">
                  <h6>Ghi chú admin</h6>
                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                    {selectedConfirmation.adminNote}
                  </div>
                </div>
              )}

              <div className="mt-3">
                <Row>
                  <Col md={6}>
                    <small className="text-muted">
                      <strong>Yêu cầu lúc:</strong> {moment(selectedConfirmation.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                    </small>
                  </Col>
                  <Col md={6}>
                    {selectedConfirmation.processedAt && (
                      <small className="text-muted">
                        <strong>Xử lý lúc:</strong> {moment(selectedConfirmation.processedAt).format('DD/MM/YYYY HH:mm:ss')}
                      </small>
                    )}
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Confirm Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <CheckCircle className="me-2 text-success" size={20} />
            Xác nhận thanh toán
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xác nhận thanh toán này?</p>
          {selectedConfirmation && (
            <div className="bg-light p-3 rounded mb-3">
              <strong>Booking #{selectedConfirmation.bookingId}</strong><br/>
              <strong>Khách hàng:</strong> {selectedConfirmation.customerName}<br/>
              <strong>Số tiền:</strong> {formatCurrency(selectedConfirmation.amount)}
            </div>
          )}
          <Form.Group>
            <Form.Label>Ghi chú admin *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Nhập ghi chú về việc xác nhận thanh toán..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="success" 
            onClick={() => processConfirmation('confirm')}
            disabled={!adminNote.trim() || processing !== null}
          >
            {processing ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="me-2" />
                Xác nhận
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <XCircle className="me-2 text-danger" size={20} />
            Từ chối thanh toán
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn từ chối thanh toán này?</p>
          {selectedConfirmation && (
            <div className="bg-light p-3 rounded mb-3">
              <strong>Booking #{selectedConfirmation.bookingId}</strong><br/>
              <strong>Khách hàng:</strong> {selectedConfirmation.customerName}<br/>
              <strong>Số tiền:</strong> {formatCurrency(selectedConfirmation.amount)}
            </div>
          )}
          <Form.Group>
            <Form.Label>Lý do từ chối *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Nhập lý do từ chối thanh toán..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="danger" 
            onClick={() => processConfirmation('reject')}
            disabled={!adminNote.trim() || processing !== null}
          >
            {processing ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <XCircle size={16} className="me-2" />
                Từ chối
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPaymentConfirmationPage;