import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Tooltip,
  Modal,
  Pagination
} from 'react-bootstrap';
import { 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus,
  ChefHat,
  RefreshCw,
  Filter,
  DollarSign,
  Image,
  Star,
  TrendingUp
} from 'lucide-react';
import { adminDishApi } from '../api/adminDishApi';

interface Dish {
  id: number;
  name: string;
  price: number;
  imageUrls: string[];
  description?: string;
  category?: string;
  isAvailable?: boolean;
  rating?: number;
}

const AdminDishPage: React.FC = () => {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([]);
  const [currentPageDishes, setCurrentPageDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mock categories - bạn có thể lấy từ API
  const categories = ['ALL', 'Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống', 'Món nướng'];

  // Pagination calculations
  const totalPages = Math.ceil(filteredDishes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Update current page dishes when filtered dishes or pagination changes
  useEffect(() => {
    const paginatedDishes = filteredDishes.slice(startIndex, endIndex);
    setCurrentPageDishes(paginatedDishes);
  }, [filteredDishes, currentPage, itemsPerPage, startIndex, endIndex]);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminDishApi.getAll();
      setDishes(res.data);
      setFilteredDishes(res.data);
      setCurrentPage(1); // Reset to first page when fetching new data
    } catch (error) {
      console.error('Lỗi khi tải danh sách món ăn:', error);
      setError('Không thể tải danh sách món ăn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDish) return;
    
    try {
      // await adminDishApi.delete(selectedDish.id);
      console.log('Xóa món ăn:', selectedDish.id);
      await fetchDishes();
      setShowDeleteModal(false);
      setSelectedDish(null);
    } catch (error) {
      console.error('Lỗi khi xóa món ăn:', error);
      alert('Không thể xóa món ăn. Vui lòng thử lại.');
    }
  };

  const confirmDelete = (dish: Dish) => {
    setSelectedDish(dish);
    setShowDeleteModal(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
    filterDishes(term, categoryFilter);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1); // Reset to first page when filtering
    filterDishes(searchTerm, category);
  };

  const filterDishes = (search: string, category: string) => {
    let filtered = dishes;

    // Filter by search term
    if (search) {
      filtered = filtered.filter(dish => 
        dish.name.toLowerCase().includes(search.toLowerCase()) ||
        dish.id.toString().includes(search)
      );
    }

    // Filter by category
    if (category !== 'ALL') {
      filtered = filtered.filter(dish => dish.category === category);
    }

    setFilteredDishes(filtered);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getStatsData = () => {
    const total = dishes.length;
    const available = dishes.filter(d => d.isAvailable !== false).length;
    const avgPrice = dishes.length > 0 ? dishes.reduce((sum, d) => sum + d.price, 0) / dishes.length : 0;
    const topRated = dishes.filter(d => (d.rating || 0) >= 4.5).length;
    
    return { total, available, avgPrice, topRated };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    } else {
      // Show first page
      items.push(
        <Pagination.Item
          key={1}
          active={1 === currentPage}
          onClick={() => handlePageChange(1)}
        >
          1
        </Pagination.Item>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }

      // Show last page
      if (totalPages > 1) {
        items.push(
          <Pagination.Item
            key={totalPages}
            active={totalPages === currentPage}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </Pagination.Item>
        );
      }
    }

    return items;
  };

  useEffect(() => {
    fetchDishes();
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
                <ChefHat className="me-2" size={28} />
                Quản lý món ăn
              </h2>
              <p className="text-muted mb-0">Quản lý thực đơn và món ăn của nhà hàng</p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
                onClick={fetchDishes}
                disabled={loading}
                className="d-flex align-items-center"
              >
                <RefreshCw size={16} className="me-2" />
                Làm mới
              </Button>
              <Button 
                variant="primary" 
                onClick={() => navigate('/admin/dishes/new')}
                className="d-flex align-items-center"
              >
                <Plus size={16} className="me-2" />
                Thêm món ăn mới
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
                <ChefHat className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.total}</h3>
                <p className="text-muted mb-0 small">Tổng món ăn</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 rounded-3 p-3 me-3">
                <TrendingUp className="text-success" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold text-success">{stats.available}</h3>
                <p className="text-muted mb-0 small">Đang bán</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 rounded-3 p-3 me-3">
                <DollarSign className="text-warning" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold text-warning">{formatPrice(stats.avgPrice)}</h3>
                <p className="text-muted mb-0 small">Giá trung bình</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 rounded-3 p-3 me-3">
                <Star className="text-info" size={24} />
              </div>
              <div>
                <h3 className="mb-0 fw-bold text-info">{stats.topRated}</h3>
                <p className="text-muted mb-0 small">Đánh giá cao</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Row className="align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên món ăn, ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'ALL' ? 'Tất cả danh mục' : cat}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                size="sm"
              >
                <option value={5}>5/trang</option>
                <option value={10}>10/trang</option>
                <option value={20}>20/trang</option>
                <option value={50}>50/trang</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <small className="text-muted">
                Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredDishes.length)} / {filteredDishes.length} món ăn
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
          ) : filteredDishes.length === 0 ? (
            <div className="text-center py-5">
              <ChefHat size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Không có món ăn nào</h5>
              <p className="text-muted mb-0">
                {searchTerm || categoryFilter !== 'ALL' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có món ăn nào trong thực đơn'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table className="mb-0" hover>
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 fw-semibold text-muted small">ID</th>
                      <th className="border-0 fw-semibold text-muted small">MÓN ĂN</th>
                      <th className="border-0 fw-semibold text-muted small">GIÁ</th>
                      <th className="border-0 fw-semibold text-muted small">HÌNH ẢNH</th>
                      <th className="border-0 fw-semibold text-muted small">TRẠNG THÁI</th>
                      <th className="border-0 fw-semibold text-muted small text-center">HÀNH ĐỘNG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageDishes.map((dish) => (
                      <tr key={dish.id} className="align-middle">
                        <td className="fw-medium text-muted">#{dish.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              {dish.imageUrls && dish.imageUrls.length > 0 ? (
                                <img 
                                  src={dish.imageUrls[0]} 
                                  alt={dish.name}
                                  className="rounded"
                                  style={{ 
                                    width: '50px', 
                                    height: '50px', 
                                    objectFit: 'cover',
                                    border: '2px solid #f8f9fa'
                                  }}
                                />
                              ) : (
                                <div 
                                  className="bg-light rounded d-flex align-items-center justify-content-center"
                                  style={{ width: '50px', height: '50px' }}
                                >
                                  <Image size={20} className="text-muted" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="fw-medium">{dish.name}</div>
                              {dish.description && (
                                <small className="text-muted">{dish.description.substring(0, 50)}...</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <DollarSign size={16} className="text-success me-1" />
                            <span className="fw-bold text-success">{formatPrice(dish.price)}</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="border">
                            {dish.imageUrls?.length || 0} ảnh
                          </Badge>
                        </td>
                        <td>
                          <Badge 
                            bg={dish.isAvailable !== false ? 'success' : 'secondary'}
                            className="px-3 py-2"
                            style={{fontSize: '0.75rem'}}
                          >
                            {dish.isAvailable !== false ? 'Đang bán' : 'Ngừng bán'}
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
                                variant="outline-info"
                                onClick={() => navigate(`/admin/dishes/${dish.id}`)}
                                className="d-flex align-items-center"
                              >
                                <Eye size={14} />
                              </Button>
                            </OverlayTrigger>
                            
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Chỉnh sửa</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-warning"
                                onClick={() => navigate(`/admin/dishes/${dish.id}/edit`)}
                                className="d-flex align-items-center"
                              >
                                <Edit3 size={14} />
                              </Button>
                            </OverlayTrigger>
                            
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Xóa món ăn</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => confirmDelete(dish)}
                                className="d-flex align-items-center"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </OverlayTrigger>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                  <div className="text-muted small">
                    Trang {currentPage} / {totalPages} 
                    <span className="ms-2">
                      ({filteredDishes.length} món ăn)
                    </span>
                  </div>
                  
                  <Pagination className="mb-0">
                    <Pagination.First 
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    
                    {generatePaginationItems()}
                    
                    <Pagination.Next 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last 
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa món ăn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                 style={{width: '64px', height: '64px'}}>
              <Trash2 className="text-danger" size={24} />
            </div>
            <h5>Bạn có chắc chắn muốn xóa món ăn này?</h5>
            <p className="text-muted mb-0">
              Món ăn <strong>{selectedDish?.name}</strong> sẽ bị xóa vĩnh viễn.
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy bỏ
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} className="me-2" />
            Xóa món ăn
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDishPage;