import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import api from '../api/axiosConfigUser';
import { 
  createReview, 
  getDishReviews, 
  getDishReviewStats, 
  ReviewDTO, 
  ReviewStats,
  PaginationInfo 
} from '../api/reviewApi';
import { useLoading } from '../context/LoadingContext';
import { useCart } from '../context/CartContext';
import '../assets/css/DishDetails.css';

interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  createdAt: string;
  orderCount?: number;
  category?: string;
  ingredients?: string[];
  averageRating?: number;
  totalReviews?: number;
}

interface ReviewForm {
  rating: number;
  comment: string;
  customerName: string;
  customerEmail?: string;
}

const DishDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [dish, setDish] = useState<Dish | null>(null);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewPagination, setReviewPagination] = useState<PaginationInfo | null>(null);
  const [relatedDishes, setRelatedDishes] = useState<Dish[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    rating: 5,
    comment: '',
    customerName: '',
    customerEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(0);
  const [reviewFilters, setReviewFilters] = useState({
    rating: undefined as number | undefined,
    verified: undefined as boolean | undefined
  });
  const { setLoading } = useLoading();
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchDishDetails();
      fetchReviews();
      fetchReviewStats();
      fetchRelatedDishes();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReviews();
    }
  }, [currentReviewPage, reviewFilters]);

  const fetchDishDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dishes/${id}`);
      setDish(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết món ăn:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const { reviews: reviewsData, pagination } = await getDishReviews(
        parseInt(id!), 
        {
          page: currentReviewPage,
          size: 5,
          sortBy: 'createdAt',
          sortDir: 'desc',
          ...reviewFilters
        }
      );
      setReviews(reviewsData);
      setReviewPagination(pagination);
    } catch (error) {
      console.error('Lỗi khi lấy đánh giá:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const stats = await getDishReviewStats(parseInt(id!));
      setReviewStats(stats);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê đánh giá:', error);
    }
  };

  const fetchRelatedDishes = async () => {
    try {
      const response = await api.get(`/dishes/${id}/related`);
      setRelatedDishes(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy món ăn liên quan:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewForm.customerName.trim() || !reviewForm.comment.trim()) {
      alert('Vui lòng điền đầy đủ thông tin đánh giá');
      return;
    }

    try {
      setIsSubmitting(true);
      await createReview(parseInt(id!), {
        dishId: parseInt(id!),
        customerName: reviewForm.customerName,
        customerEmail: reviewForm.customerEmail || undefined,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      
      // Reset form và ẩn form
      setReviewForm({
        rating: 5,
        comment: '',
        customerName: '',
        customerEmail: ''
      });
      setShowReviewForm(false);
      
      // Refresh data
      await Promise.all([
        fetchReviews(), 
        fetchReviewStats(), 
        fetchDishDetails()
      ]);
      
      alert('Đánh giá của bạn đã được gửi thành công!');
    } catch (error: any) {
      console.error('Lỗi khi gửi đánh giá:', error);
      alert(error.message || 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentReviewPage(newPage);
  };

  const handleFilterChange = (filterType: 'rating' | 'verified', value: any) => {
    setReviewFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentReviewPage(0); // Reset to first page when filtering
  };

  const renderStars = (rating: number, interactive: boolean = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!reviewStats) return null;

    const { ratingDistribution, totalReviews } = reviewStats;
    
    return (
      <div className="rating-distribution mb-4">
        <h6>Phân bố đánh giá</h6>
        {[5, 4, 3, 2, 1].map(rating => {
          const count = ratingDistribution[rating] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          
          return (
            <div key={rating} className="rating-bar mb-2">
              <div className="d-flex align-items-center">
                <span className="me-2">{rating}★</span>
                <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-muted">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPagination = () => {
    if (!reviewPagination || reviewPagination.totalPages <= 1) return null;

    const { currentPage, totalPages, hasNext, hasPrev } = reviewPagination;

    return (
      <nav aria-label="Review pagination">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${!hasPrev ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrev}
            >
              Trước
            </button>
          </li>
          
          {Array.from({ length: totalPages }, (_, i) => (
            <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(i)}
              >
                {i + 1}
              </button>
            </li>
          ))}
          
          <li className={`page-item ${!hasNext ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNext}
            >
              Sau
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!dish) {
    return <div className="container py-5" style={{ paddingTop: '120px' }}>Đang tải...</div>;
  }

  return (
    <div style={{ paddingTop: '120px' }}>
      {/* Breadcrumb */}
      <div className="container py-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
            <li className="breadcrumb-item"><Link to="/menu">Menu</Link></li>
            <li className="breadcrumb-item active">{dish.name}</li>
          </ol>
        </nav>
      </div>

      {/* Dish Details */}
      <div className="container py-4">
        <div className="row">
          {/* Image Gallery */}
          <div className="col-lg-6 mb-4">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Swiper
                navigation
                pagination={{ clickable: true }}
                modules={[Navigation, Pagination]}
                className="dish-image-swiper"
              >
                {dish.imageUrls.map((image, index) => (
                  <SwiperSlide key={index}>
                    <img src={image} alt={`${dish.name} - ${index + 1}`} className="img-fluid rounded" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.div>
          </div>

          {/* Dish Information */}
          <div className="col-lg-6">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="dish-title mb-3">{dish.name}</h1>
              
              {/* Rating */}
              <div className="rating-section mb-3">
                {renderStars(reviewStats?.averageRating || 0)}
                <span className="rating-text ms-2">
                  ({reviewStats?.averageRating?.toFixed(1) || '0.0'}) - {reviewStats?.totalReviews || 0} đánh giá
                </span>
              </div>

              {/* Rating Distribution */}
              {renderRatingDistribution()}

              {/* Price */}
              <div className="price-section mb-4">
                <span className="price">{dish.price.toLocaleString()}₫</span>
                {dish.orderCount && (
                  <span className="badge bg-success ms-3">{dish.orderCount} lượt đặt</span>
                )}
              </div>

              {/* Description */}
              <div className="description-section mb-4">
                <h5>Mô tả món ăn</h5>
                <p>{dish.description}</p>
              </div>

              {/* Ingredients */}
              {dish.ingredients && dish.ingredients.length > 0 && (
                <div className="ingredients-section mb-4">
                  <h5>Thành phần chính</h5>
                  <div className="ingredients-tags">
                    {dish.ingredients.map((ingredient, index) => (
                      <span key={index} className="badge bg-light text-dark me-2 mb-2">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-buttons">
                <button 
                  className="btn btn-primary btn-lg me-3"
                  onClick={() => {
                    if (dish) {
                      addToCart({
                        id: dish.id,
                        name: dish.name,
                        price: dish.price,
                        image: dish.imageUrls[0] || ''
                      });
                      alert(`Đã thêm "${dish.name}" vào giỏ hàng!`);
                    }
                  }}
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  Thêm vào giỏ hàng
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  <i className="fas fa-star me-2"></i>
                  Đánh giá món ăn
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <motion.div
          className="container py-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Đánh giá món ăn</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmitReview}>
                    <div className="mb-3">
                      <label className="form-label">Tên của bạn *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={reviewForm.customerName}
                        onChange={(e) => setReviewForm({...reviewForm, customerName: e.target.value})}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email (tùy chọn)</label>
                      <input
                        type="email"
                        className="form-control"
                        value={reviewForm.customerEmail}
                        onChange={(e) => setReviewForm({...reviewForm, customerEmail: e.target.value})}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Đánh giá *</label>
                      <div>
                        {renderStars(reviewForm.rating, true, (rating) => 
                          setReviewForm({...reviewForm, rating})
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Nhận xét *</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                        placeholder="Chia sẻ trải nghiệm của bạn về món ăn này..."
                        required
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowReviewForm(false)}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reviews Section */}
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Đánh giá từ khách hàng ({reviewStats?.totalReviews || 0})</h3>
          
          {/* Review Filters */}
          <div className="d-flex gap-2">
            <select 
              className="form-select form-select-sm"
              value={reviewFilters.rating || ''}
              onChange={(e) => handleFilterChange('rating', e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">Tất cả đánh giá</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
            
            <select 
              className="form-select form-select-sm"
              value={reviewFilters.verified?.toString() || ''}
              onChange={(e) => handleFilterChange('verified', e.target.value ? e.target.value === 'true' : undefined)}
            >
              <option value="">Tất cả</option>
              <option value="true">Đã xác thực</option>
              <option value="false">Chưa xác thực</option>
            </select>
          </div>
        </div>
        
        {reviewsLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">Chưa có đánh giá nào cho món ăn này.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowReviewForm(true)}
            > 
                          Gửi đánh giá đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className="review-list">
              {reviews.map((review, index) => (
                <div key={index} className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-bold">{review.customerName}</div>
                      <small className="text-muted">
                        {review.createdAt ? formatDate(review.createdAt) : 'Không rõ thời gian'}
                      </small>
                    </div>
                    <div className="mb-2">
                      {renderStars(review.rating)}
                    </div>
                    <p>{review.comment}</p>
                   {review.isVerified && (
                      <span className="badge bg-info text-dark">Đã xác thực</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      {/* Related Dishes Section */}
      {relatedDishes.length > 0 && (
        <div className="container py-5">
          <h4 className="mb-4">Món ăn liên quan</h4>
          <div className="row">
            {relatedDishes.map((item) => (
              <div key={item.id} className="col-md-3 mb-4">
                <div className="card h-100">
                  <img 
                    src={item.imageUrls[0]} 
                    alt={item.name} 
                    className="card-img-top" 
                    style={{ height: '200px', objectFit: 'cover' }} 
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{item.name}</h5>
                    <p className="card-text text-muted mb-2">{item.price.toLocaleString()}₫</p>
                    <Link to={`/dishes/${item.id}`} className="mt-auto btn btn-outline-primary btn-sm">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DishDetails;