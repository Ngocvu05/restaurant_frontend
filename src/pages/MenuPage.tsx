import React, { useEffect, useState, useMemo } from 'react';
import { fetchDishes } from '../api/dishApi';
import { useLoading } from '../context/LoadingContext';
import '../assets/css/MenuPage.css';
import { Link } from 'react-router-dom';

interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrls: string[] | string;
  category: string;
}

interface FilterState {
  category: string | null;
  priceRange: 'all' | 'under50k' | '50k-100k' | '100k-200k' | 'over200k';
  sortBy: 'name' | 'price' | 'category' | 'newest';
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
}

interface ViewOptions {
  layout: 'grid' | 'list';
  itemsPerPage: number;
}

const MenuFilters = ({ dishes, filters, onFilterChange, totalResults }: {
  dishes: Dish[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalResults: number;
}) => {
  const categories = useMemo(() => Array.from(new Set(dishes.map((dish: Dish) => dish.category))), [dishes]);
  const priceRanges = [
    { value: 'under50k', label: 'Dưới 50k', count: 0 },
    { value: '50k-100k', label: '50k - 100k', count: 0 },
    { value: '100k-200k', label: '100k - 200k', count: 0 },
    { value: 'over200k', label: 'Trên 200k', count: 0 },
  ];

  // Đếm số món trong từng khoảng giá
  dishes.forEach(dish => {
    if (dish.price < 50000) priceRanges[0].count++;
    else if (dish.price <= 100000) priceRanges[1].count++;
    else if (dish.price <= 200000) priceRanges[2].count++;
    else priceRanges[3].count++;
  });

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFilterChange({
      category: null,
      priceRange: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      searchTerm: '',
    });
  };

  const hasActiveFilters = filters.category || filters.priceRange !== 'all' || filters.searchTerm || filters.sortBy !== 'name' || filters.sortOrder !== 'asc';

  return (
    <div className="menu-filters bg-white shadow-sm rounded-lg p-4 mb-4">
      {/* Header with results count */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">Bộ lọc thực đơn</h5>
          <small className="text-muted">Tìm thấy {totalResults} món ăn</small>
        </div>
        {hasActiveFilters && (
          <button className="btn btn-outline-secondary btn-sm" onClick={clearAllFilters}>
            <i className="fas fa-times me-1"></i>
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="position-relative">
            <input
              type="text"
              className="form-control form-control-lg ps-5"
              placeholder="Tìm kiếm món ăn theo tên hoặc mô tả..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
            <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          </div>
        </div>
      </div>

      {/* Filter options */}
      <div className="row">
        {/* Category Filter */}
        <div className="col-lg-3 col-md-6 mb-3">
          <label className="form-label fw-semibold">
            <i className="fas fa-tags me-2 text-primary"></i>
            Danh mục
          </label>
          <select
            className="form-select"
            value={filters.category || 'all'}
            onChange={(e) => handleFilterChange('category', e.target.value === 'all' ? null : e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({dishes.filter(d => d.category === cat).length})
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="col-lg-3 col-md-6 mb-3">
          <label className="form-label fw-semibold">
            <i className="fas fa-dollar-sign me-2 text-success"></i>
            Khoảng giá
          </label>
          <select
            className="form-select"
            value={filters.priceRange}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
          >
            <option value="all">Tất cả mức giá</option>
            {priceRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label} ({range.count})
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="col-lg-3 col-md-6 mb-3">
          <label className="form-label fw-semibold">
            <i className="fas fa-sort me-2 text-info"></i>
            Sắp xếp theo
          </label>
          <select
            className="form-select"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="name">Tên món</option>
            <option value="price">Giá tiền</option>
            <option value="category">Danh mục</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="col-lg-3 col-md-6 mb-3">
          <label className="form-label fw-semibold">
            <i className="fas fa-sort-amount-down me-2 text-warning"></i>
            Thứ tự
          </label>
          <select
            className="form-select"
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
          >
            <option value="asc">Tăng dần</option>
            <option value="desc">Giảm dần</option>
          </select>
        </div>
      </div>

      {/* Quick category filters */}
      <div className="mt-3">
        <label className="form-label fw-semibold mb-2">Lọc nhanh theo danh mục:</label>
        <div className="d-flex flex-wrap gap-2">
          <button
            className={`btn btn-sm ${!filters.category ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleFilterChange('category', null)}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${filters.category === cat ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterChange('category', filters.category === cat ? null : cat)}
            >
              {cat}
              <span className="badge bg-light text-dark ms-1">
                {dishes.filter(d => d.category === cat).length}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ViewControls = ({ viewOptions, onViewChange, totalResults, currentPage, itemsPerPage }: {
  viewOptions: ViewOptions;
  onViewChange: (options: ViewOptions) => void;
  totalResults: number;
  currentPage: number;
  itemsPerPage: number;
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalResults);

  return (
    <div className="view-controls bg-white shadow-sm rounded-lg p-3 mb-4">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <span className="text-muted me-3">
            Hiển thị {startItem}-{endItem} của {totalResults} món
          </span>
          <div className="btn-group" role="group">
            <button
              className={`btn btn-sm ${viewOptions.layout === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => onViewChange({ ...viewOptions, layout: 'grid' })}
              title="Xem dạng lưới"
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              className={`btn btn-sm ${viewOptions.layout === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => onViewChange({ ...viewOptions, layout: 'list' })}
              title="Xem dạng danh sách"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center">
          <label className="form-label me-2 mb-0">Hiển thị:</label>
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto' }}
            value={viewOptions.itemsPerPage}
            onChange={(e) => onViewChange({ ...viewOptions, itemsPerPage: Number(e.target.value) })}
          >
            <option value={6}>6 món</option>
            <option value={12}>12 món</option>
            <option value={24}>24 món</option>
            <option value={48}>48 món</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const DishCard = ({ dish, layout }: { dish: Dish; layout: 'grid' | 'list' }) => {
  // Xử lý imageUrls giống như BookingPage
  const imageUrl = dish.imageUrls?.[0] || '/placeholder-dish.jpg';

  if (layout === 'list') {
    return (
      <div className="dish-card-list bg-white shadow-sm rounded-lg mb-3 overflow-hidden">
        <div className="row g-0">
          <div className="col-md-3">
            <img
              src={imageUrl}
              alt={dish.name}
              className="img-fluid h-100 w-100"
              style={{ objectFit: 'cover', minHeight: '150px' }}
            />
          </div>
          <div className="col-md-9">
            <div className="card-body h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="card-title mb-1">{dish.name}</h5>
                  <span className="badge bg-primary ms-2">{dish.category}</span>
                </div>
                <p className="card-text text-muted mb-3">{dish.description}</p>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="fs-4 fw-bold text-success">
                  {dish.price.toLocaleString()}₫
                </span>
                <button className="btn btn-outline-primary">
                  <i className="fas fa-plus me-1"></i>
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-lg-4 col-md-6 mb-4">
      <Link to={`/dishes/${dish.id}`} className="text-decoration-none text-dark">
        <div className="dish-card bg-white shadow-sm rounded-lg overflow-hidden h-100 transition-all">        
            <div className="position-relative">
              <img
                src={imageUrl}
                alt={dish.name}
                className="card-img-top"
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <span className="badge bg-primary position-absolute top-0 end-0 m-2">
                {dish.category}
              </span>
            </div>
          <div className="card-body d-flex flex-column">
            <h5 className="card-title mb-2">{dish.name}</h5>
            <p className="card-text text-muted flex-grow-1 small mb-3">
              {dish.description}
            </p>
            <div className="d-flex justify-content-between align-items-center">
              <span className="fs-5 fw-bold text-success">
                {dish.price.toLocaleString()}₫
              </span>
              <button className="btn btn-primary btn-sm">
                <i className="fas fa-plus me-1"></i>
                Thêm
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="pagination-container bg-white shadow-sm rounded-lg p-4 mt-4">
      <nav aria-label="Điều hướng trang">
        <ul className="pagination justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
              <span className="ms-1 d-none d-sm-inline">Trước</span>
            </button>
          </li>

          {getVisiblePages().map((page, index) => (
            <li key={index} className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}>
              {page === '...' ? (
                <span className="page-link">...</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => onPageChange(Number(page))}
                >
                  {page}
                </button>
              )}
            </li>
          ))}

          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="me-1 d-none d-sm-inline">Sau</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const MenuPage: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    priceRange: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    searchTerm: '',
  });
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    layout: 'grid',
    itemsPerPage: 12,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();

  // Load dishes on component mount
  useEffect(() => {
    const loadDishes = async () => {
      try {
        console.log('Bắt đầu tải danh sách món ăn...');
        setLoading(true);
        setGlobalLoading(true);
        
        const data = await fetchDishes();
        console.log('Dữ liệu món ăn đã tải:', data);
        console.log('Số lượng món ăn:', data?.length);
        console.log('Loại dữ liệu:', typeof data);
        console.log('Có phải array không:', Array.isArray(data));
        
        if (Array.isArray(data)) {
          setDishes(data);
          console.log('Đã set dishes thành công');
        } else if (data && typeof data === 'object') {
          console.log('Data có thể là object, thử truy cập data.data hoặc data.dishes');
          // Thử các khả năng response format khác
          const dishArray = data.data || data.dishes || data;
          if (Array.isArray(dishArray)) {
            setDishes(dishArray);
          } else {
            console.error('Không thể tìm thấy mảng dishes trong response');
            setDishes([]);
          }
        } else {
          console.error('Dữ liệu không hợp lệ:', data);
          setDishes([]);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách món ăn:', error);
        setDishes([]);
      } finally {
        setLoading(false);
        setGlobalLoading(false);
        console.log('Hoàn thành tải dữ liệu');
      }
    };

    loadDishes();
  }, [setGlobalLoading]);

  // Filter and sort dishes
  const filteredAndSortedDishes = useMemo(() => {
    let result = [...dishes];

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(dish =>
        dish.name.toLowerCase().includes(searchLower) ||
        dish.description.toLowerCase().includes(searchLower) ||
        dish.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (filters.category) {
      result = result.filter(dish => dish.category === filters.category);
    }

    // Filter by price range
    switch (filters.priceRange) {
      case 'under50k':
        result = result.filter(dish => dish.price < 50000);
        break;
      case '50k-100k':
        result = result.filter(dish => dish.price >= 50000 && dish.price <= 100000);
        break;
      case '100k-200k':
        result = result.filter(dish => dish.price > 100000 && dish.price <= 200000);
        break;
      case 'over200k':
        result = result.filter(dish => dish.price > 200000);
        break;
    }

    // Sort dishes
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [dishes, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedDishes.length / viewOptions.itemsPerPage);
  const startIndex = (currentPage - 1) * viewOptions.itemsPerPage;
  const currentDishes = filteredAndSortedDishes.slice(startIndex, startIndex + viewOptions.itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, viewOptions.itemsPerPage]);

  if (loading) {
    return (
      <div className="menu-page container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3">Đang tải thực đơn...</p>
          <small className="text-muted">Kiểm tra console để xem thông tin debug</small>
        </div>
      </div>
    );
  }

  // Debug info - chỉ log khi cần thiết
  if (dishes.length === 0 && !loading) {
    console.log('MenuPage render - No dishes found:');
    console.log('- Dishes length:', dishes.length);
    console.log('- Loading state:', loading);
    console.log('- Raw dishes data:', dishes);
  }

  return (
    <div className="menu-page container-fluid py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container" style={{paddingTop: '120px'}}>
        {/* Page Header */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">
            <i className="fas fa-utensils me-3"></i>
            Thực Đơn Nhà Hàng
          </h1>
          <p className="lead text-muted">
            Khám phá những món ăn ngon và đa dạng của chúng tôi
          </p>
        </div>

        {/* Filters */}
        <MenuFilters
          dishes={dishes}
          filters={filters}
          onFilterChange={setFilters}
          totalResults={filteredAndSortedDishes.length}
        />

        {/* View Controls */}
        <ViewControls
          viewOptions={viewOptions}
          onViewChange={setViewOptions}
          totalResults={filteredAndSortedDishes.length}
          currentPage={currentPage}
          itemsPerPage={viewOptions.itemsPerPage}
        />

        {/* Dishes Display */}
        {currentDishes.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-4">
              <i className="fas fa-search fa-4x text-muted mb-3"></i>
              <h3 className="text-muted">Không tìm thấy món ăn nào</h3>
              <p className="text-muted">
                Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem thêm món ăn khác
              </p>
            </div>
            <button
              className="btn btn-outline-primary"
              onClick={() => setFilters({
                category: null,
                priceRange: 'all',
                sortBy: 'name',
                sortOrder: 'asc',
                searchTerm: '',
              })}
            >
              <i className="fas fa-refresh me-2"></i>
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <>
            {viewOptions.layout === 'grid' ? (
              <div className="row">
                {currentDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} layout="grid" />
                ))}
              </div>
            ) : (
              <div>
                {currentDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} layout="list" />
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MenuPage;