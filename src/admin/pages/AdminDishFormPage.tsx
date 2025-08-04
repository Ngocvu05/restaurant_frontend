import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Breadcrumb
} from 'react-bootstrap';
import { 
  ArrowLeft, 
  Save, 
  ChefHat,
  DollarSign,
  FileText,
  Tag,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { adminDishApi } from '../api/adminDishApi';
import ImageUploader from '../components/ImageUploader';
import { adminUploadApi } from '../api/adminUploadApi';

interface FormData {
  name: string;
  price: string;
  imageUrls: string[];
  description: string;
  category: string;
}

const AdminDishFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    imageUrls: [],
    description: '',
    category: '',
  });

  const [temporaryUploadedImages, setTemporaryUploadedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  // Categories for dropdown
  const categories = [
    'Khai vị',
    'Món chính', 
    'Tráng miệng',
    'Đồ uống',
    'Món nướng',
    'Món chay',
    'Đặc sản'
  ];

  // Load dish data for editing
  useEffect(() => {
    if (isEdit) {
      const loadDish = async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await adminDishApi.getById(Number(id!));
          const dish = res.data;
          setFormData({
            name: dish.name,
            price: dish.price.toString(),
            imageUrls: dish.imageUrls || [],
            description: dish.description || '',
            category: dish.category || '',
          });
        } catch (err) {
          setError('Không thể tải thông tin món ăn. Vui lòng thử lại.');
          console.error('Error loading dish:', err);
        } finally {
          setLoading(false);
        }
      };
      loadDish();
    }
  }, [id, isEdit]);

  // Handle image upload
  const handleImageUpload = (urls: string[]) => {
    const newUploads = urls.filter((url) => !formData.imageUrls.includes(url));
    setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUploads] }));
    setTemporaryUploadedImages((prev) => [...prev, ...newUploads]);
  };

  // Handle image removal
  const handleRemoveImage = async (url: string) => {
    try {
      await adminUploadApi.deleteByUrl(url);
      setFormData((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((item) => item !== url),
      }));
    } catch (err) {
      console.warn('Lỗi khi xoá ảnh khỏi server:', err);
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation state when user starts typing
    if (validated) {
      setValidated(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (isEdit) {
        await adminDishApi.update(Number(id!), submitData);
      } else {
        await adminDishApi.create(submitData);
      }

      navigate('/admin/dishes', {
        state: { 
          message: isEdit ? 'Cập nhật món ăn thành công!' : 'Thêm món ăn mới thành công!' 
        }
      });
    } catch (err) {
      setError(isEdit ? 'Không thể cập nhật món ăn. Vui lòng thử lại.' : 'Không thể thêm món ăn. Vui lòng thử lại.');
      console.error('Submit error:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle go back with cleanup
  const handleGoBack = async () => {
    if (!isEdit && temporaryUploadedImages.length > 0) {
      for (const url of temporaryUploadedImages) {
        try {
          await adminUploadApi.deleteByUrl(url);
        } catch (err) {
          console.warn('Không thể xoá ảnh:', url);
        }
      }
    }
    navigate('/admin/dishes');
  };

  // Format price display
  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(num);
  };

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
            <Breadcrumb.Item href="/admin/dishes">Quản lý món ăn</Breadcrumb.Item>
            <Breadcrumb.Item active>
              {isEdit ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
            </Breadcrumb.Item>
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
                <ChefHat className="me-2" size={28} />
                {isEdit ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
              </h2>
              <p className="text-muted mb-0">
                {isEdit ? 'Cập nhật thông tin món ăn trong thực đơn' : 'Thêm món ăn mới vào thực đơn nhà hàng'}
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
              <AlertCircle size={20} className="me-2" />
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col lg={8}>
          {/* Main Form Card */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold">Thông tin cơ bản</h5>
            </Card.Header>
            <Card.Body>
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Row>
                  <Col md={12} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-medium">
                        <ChefHat size={16} className="me-2" />
                        Tên món ăn <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nhập tên món ăn..."
                        required
                        className="form-control-lg"
                      />
                      <Form.Control.Feedback type="invalid">
                        Vui lòng nhập tên món ăn.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-medium">
                        <DollarSign size={16} className="me-2" />
                        Giá món ăn <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0"
                        required
                        min="0"
                        step="1000"
                      />
                      <Form.Control.Feedback type="invalid">
                        Vui lòng nhập giá hợp lệ.
                      </Form.Control.Feedback>
                      {formData.price && (
                        <Form.Text className="text-success fw-medium">
                          {formatPrice(formData.price)}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-medium">
                        <Tag size={16} className="me-2" />
                        Danh mục
                      </Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={12} className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-medium">
                        <FileText size={16} className="me-2" />
                        Mô tả món ăn
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Mô tả chi tiết về món ăn, nguyên liệu, cách chế biến..."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Form Actions */}
                <div className="d-flex gap-3 pt-3 border-top">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={submitLoading}
                    className="d-flex align-items-center"
                  >
                    {submitLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {isEdit ? 'Đang cập nhật...' : 'Đang thêm...'}
                      </>
                    ) : (
                      <>
                        <Save size={16} className="me-2" />
                        {isEdit ? 'Cập nhật món ăn' : 'Thêm món ăn'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="lg"
                    onClick={handleGoBack}
                    disabled={submitLoading}
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Image Upload Card */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold">
                <ImageIcon size={20} className="me-2" />
                Hình ảnh món ăn
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Badge bg="info" className="mb-2">
                  {formData.imageUrls.length} ảnh đã chọn
                </Badge>
                <Form.Control
                  type="text"
                  value={formData.imageUrls.join(', ')}
                  disabled
                  className="mb-3"
                  placeholder="Chưa có ảnh nào được chọn"
                />
              </div>
              
              <ImageUploader
                onUploadSuccess={handleImageUpload}
                onRemoveImage={handleRemoveImage}
                defaultUrls={formData.imageUrls}
                allowMultiple
              />
            </Card.Body>
          </Card>

          {/* Tips Card */}
          <Card className="border-0 shadow-sm bg-light">
            <Card.Body>
              <h6 className="fw-semibold mb-3">💡 Gợi ý</h6>
              <ul className="small text-muted mb-0 ps-3">
                <li className="mb-2">Sử dụng ảnh chất lượng cao để thu hút khách hàng</li>
                <li className="mb-2">Nên có ít nhất 2-3 ảnh cho mỗi món ăn</li>
                <li className="mb-2">Mô tả chi tiết giúp khách hàng hiểu rõ hơn về món ăn</li>
                <li>Chọn danh mục phù hợp để dễ dàng quản lý</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDishFormPage;