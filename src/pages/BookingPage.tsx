import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../assets/css/BookingPage.css';
import api from '../api/axiosConfigUser';
import { fetchDishes } from '../api/dishApi';
import { getUsername } from '../utils/authUtils';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useLoading } from '../context/LoadingContext';

interface Table {
  id: number;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'BOOKED' | 'OCCUPIED';
}

interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrls: string;
  category: string;
}

interface PreOrderDish {
  dishId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface FilterState {
  category: string | null;
  priceRange: 'all' | 'under100k' | '100k-200k' | 'over200k';
  sortBy: 'name' | 'price' | 'category';
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
}

const TableSelection = ({ tables, selectedTableId, guests, onSelect }: any) => (
  <div className="table-selection">
    {tables.map((table: Table) => {
      const isSelected = selectedTableId === table.id;
      const isUnavailable = table.status !== 'AVAILABLE';
      const isOverCapacity = guests > table.capacity;
      const className = [
        'table-card',
        isSelected ? 'selected' : '',
        isUnavailable || isOverCapacity ? 'disabled' : '',
      ].join(' ');
      return (
        <div
          key={table.id}
          className={className}
          onClick={() => !isUnavailable && !isOverCapacity && onSelect(table.id)}
          title={`Sức chứa: ${table.capacity} khách\nTrạng thái: ${table.status}`}
        >
          <strong>Bàn {table.name}</strong>
          <div>{table.capacity} khách</div>
          {isOverCapacity && <small style={{ color: 'red' }}>Quá số lượng</small>}
          {isUnavailable && !isOverCapacity && (
            <small style={{ fontSize: '12px' }}>Không khả dụng</small>
          )}
        </div>
      );
    })}
  </div>
);

const DishFilters = ({ dishes, filters, onFilterChange }: {
  dishes: Dish[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}) => {
  const categories = useMemo(() => Array.from(new Set(dishes.map((dish: Dish) => dish.category))), [dishes]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="dish-filters mb-4 p-3 bg-light rounded">
      <div className="row">
        {/* Tìm kiếm */}
        <div className="col-md-3 mb-3">
          <label className="form-label fw-bold">Tìm kiếm món ăn</label>
          <input
            type="text"
            className="form-control"
            placeholder="Nhập tên món..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>

        {/* Danh mục */}
        <div className="col-md-3 mb-3">
          <label className="form-label fw-bold">Danh mục</label>
          <select
            className="form-select"
            value={filters.category || 'all'}
            onChange={(e) => handleFilterChange('category', e.target.value === 'all' ? null : e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Khoảng giá */}
        <div className="col-md-2 mb-3">
          <label className="form-label fw-bold">Khoảng giá</label>
          <select
            className="form-select"
            value={filters.priceRange}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="under100k">Dưới 100k</option>
            <option value="100k-200k">100k - 200k</option>
            <option value="over200k">Trên 200k</option>
          </select>
        </div>

        {/* Sắp xếp theo */}
        <div className="col-md-2 mb-3">
          <label className="form-label fw-bold">Sắp xếp</label>
          <select
            className="form-select"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="name">Tên món</option>
            <option value="price">Giá</option>
            <option value="category">Danh mục</option>
          </select>
        </div>

        {/* Thứ tự */}
        <div className="col-md-2 mb-3">
          <label className="form-label fw-bold">Thứ tự</label>
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

      {/* Quick filter buttons */}
      <div className="mt-2">
        <small className="text-muted">Lọc nhanh: </small>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm me-2 mb-2 ${filters.category === cat ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleFilterChange('category', filters.category === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

const DishPagination = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="dish-pagination d-flex justify-content-center align-items-center my-4">
      <button
        className="btn btn-outline-primary me-3"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <i className="fas fa-chevron-left me-1"></i>
        Trang trước
      </button>

      <div className="pagination-info mx-3">
        <span className="badge bg-primary fs-6">
          Trang {currentPage} / {totalPages}
        </span>
      </div>

      <button
        className="btn btn-outline-primary ms-3"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Trang sau
        <i className="fas fa-chevron-right ms-1"></i>
      </button>
    </div>
  );
};

const DishList = ({ dishes, preOrderDishes, onQuantityChange, filters, onFilterChange }: {
  dishes: Dish[];
  preOrderDishes: PreOrderDish[];
  onQuantityChange: (dishId: number, quantity: number) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredAndSortedDishes = useMemo(() => {
    let result = [...dishes];

    // Lọc theo tìm kiếm
    if (filters.searchTerm) {
      result = result.filter(dish => 
        dish.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        dish.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Lọc theo danh mục
    if (filters.category) {
      result = result.filter(dish => dish.category === filters.category);
    }

    // Lọc theo khoảng giá
    switch (filters.priceRange) {
      case 'under100k':
        result = result.filter(dish => dish.price < 100000);
        break;
      case '100k-200k':
        result = result.filter(dish => dish.price >= 100000 && dish.price <= 200000);
        break;
      case 'over200k':
        result = result.filter(dish => dish.price > 200000);
        break;
    }

    // Sắp xếp
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

  const totalPages = Math.ceil(filteredAndSortedDishes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDishes = filteredAndSortedDishes.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="dish-section">
      <DishFilters dishes={dishes} filters={filters} onFilterChange={onFilterChange} />
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          Hiển thị {currentDishes.length} món trong tổng số {filteredAndSortedDishes.length} món
        </h5>
        <div className="text-muted">
          {filteredAndSortedDishes.length > 0 && (
            <span>Món {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredAndSortedDishes.length)} của {filteredAndSortedDishes.length}</span>
          )}
        </div>
      </div>

      {currentDishes.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="fas fa-search fa-3x text-muted"></i>
          </div>
          <h5 className="text-muted">Không tìm thấy món ăn nào</h5>
          <p className="text-muted">Thử thay đổi bộ lọc để xem thêm món ăn khác</p>
        </div>
      ) : (
        <>
          <div className="dish-list row">
            {currentDishes.map((dish: Dish) => {
              const selected = preOrderDishes.find((d: PreOrderDish) => d.dishId === dish.id);
              return (
                <div className="col-lg-4 col-md-6 mb-4" key={dish.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="position-relative">
                      <img 
                        src={dish.imageUrls?.[0] || '/placeholder-dish.jpg'} 
                        alt={dish.name} 
                        className="card-img-top"
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <span className="badge bg-primary position-absolute top-0 start-0 m-2">
                        {dish.category}
                      </span>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{dish.name}</h5>
                      <p className="card-text flex-grow-1 text-muted small">{dish.description}</p>
                      <p className="fw-bold text-primary fs-5 mb-3">{dish.price.toLocaleString()}₫</p>
                      
                      <div className="mt-auto">
                        <label className="form-label fw-bold">Số lượng:</label>
                        <div className="input-group">
                          <button 
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => onQuantityChange(dish.id, Math.max(0, (selected?.quantity || 0) - 1))}
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            min={0} 
                            className="form-control text-center" 
                            value={selected?.quantity || 0} 
                            onChange={(e) => onQuantityChange(dish.id, Math.max(0, parseInt(e.target.value) || 0))} 
                          />
                          <button 
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => onQuantityChange(dish.id, (selected?.quantity || 0) + 1)}
                          >
                            +
                          </button>
                        </div>
                        {selected && selected.quantity > 0 && (
                          <small className="text-success mt-1 d-block">
                            Tổng: {(selected.quantity * dish.price).toLocaleString()}₫
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <DishPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

const BookingPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [form, setForm] = useState({
    selectedTableId: null as number | null,
    bookingDate: new Date() as Date | null,
    fullName: '',
    email: '',
    note: '',
    guests: 2,
  });
  const [preOrderDishes, setPreOrderDishes] = useState<PreOrderDish[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    priceRange: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    searchTerm: '',
  });
  const { loading, setLoading } = useLoading();
  const navigate = useNavigate();
  const username = getUsername();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/tables'),
      fetchDishes(),
      api.get(`/users/by-username/${username}`)
    ])
      .then(([tableRes, dishRes, userRes]) => {
        setTables(tableRes.data);
        setDishes(dishRes);
        console.log("userRes.data", userRes.data);
        setForm(f => ({
          ...f,
          fullName: userRes.data.fullName,
          email: userRes.data.email,
        }));
      })
      .catch(err => {
        console.error('Lỗi khi tải dữ liệu:', err);
      })
      .finally(() => setLoading(false));
  }, [username]);

  const handleSelectTable = (tableId: number) => setForm(f => ({ ...f, selectedTableId: tableId }));
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'guests' ? Number(value) : value }));
  };
  const handleDateChange = (date: Date | null) => setForm(f => ({ ...f, bookingDate: date }));

  const updateDishQuantity = (dishId: number, quantity: number) => {
    const dish = dishes.find((d) => d.id === dishId);
    if (!dish) return;
    
    setPreOrderDishes((prev) => {
      if (quantity <= 0) {
        return prev.filter(d => d.dishId !== dishId);
      }
      
      const existing = prev.find((d) => d.dishId === dishId);
      if (existing) {
        return prev.map((d) =>
          d.dishId === dishId ? { ...d, quantity } : d
        );
      } else {
        return [
          ...prev,
          {
            dishId: dish.id,
            name: dish.name,
            description: dish.description,
            price: dish.price,
            imageUrl: dish.imageUrls,
            quantity,
          },
        ];
      }
    });
  };

  const handleBooking = async () => {
    const { selectedTableId, bookingDate, guests, note, fullName, email } = form;
    if (!selectedTableId || !bookingDate) {
      alert('Vui lòng chọn bàn và thời gian.');
      return;
    }
    const selectedTable = tables.find((t) => t.id === selectedTableId);
    if (selectedTable && guests > selectedTable.capacity) {
      alert(`Bàn ${selectedTable.name} chỉ chứa tối đa ${selectedTable.capacity} khách.`);
      return;
    }
    const filteredPreOrders = preOrderDishes.filter((d) => d.quantity > 0);
    const booking = {
      username,
      tableId: selectedTableId,
      bookingTime: bookingDate.toISOString(),
      numberOfGuests: guests,
      note,
      fullName,
      preOrderDishes: filteredPreOrders,
      email
    };
    try {
      setLoading(true);
      await api.post('/bookings', booking);
      navigate('/booking-success', {
        state: {
          tableName: selectedTable?.name,
          bookingTime: bookingDate,
          guests,
          note,
          fullName,
          preOrderDishes,
          username,
          email,
        },
      });
    } catch (error) {
      console.error(error);
      alert('Lỗi khi đặt bàn.');
    } finally {
      setLoading(false);
    }
  };

  const totalPreOrderAmount = preOrderDishes.reduce((sum, dish) => sum + (dish.price * dish.quantity), 0);

  return (
    <div className="booking-container container" style={{ paddingTop: '120px' }}>
      <h2 className="text-center mb-4">Đặt bàn tại nhà hàng</h2>
      
      <div className="mb-4">
        <div className="row mb-3">
          <label className="col-sm-3 col-form-label">Họ tên khách</label>
          <div className="col-sm-9">
            <OverlayTrigger placement="right" overlay={<Tooltip id="tooltip-fullname">Thông tin được lấy từ tài khoản của bạn</Tooltip>}>
              <input type="text" className="form-control" value={form.fullName} readOnly />
            </OverlayTrigger>
          </div>
        </div>
        <div className="row mb-3">
          <label className="col-sm-3 col-form-label">Số khách</label>
          <div className="col-sm-9">
            <input type="number" className="form-control" name="guests" value={form.guests} min={1} onChange={handleChange} />
          </div>
        </div>
        <div className="row mb-3">
          <label className="col-sm-3 col-form-label">Ghi chú</label>
          <div className="col-sm-9">
            <textarea className="form-control" name="note" value={form.note} onChange={handleChange} />
          </div>
        </div>
        <div className="row mb-3">
          <label className="col-sm-3 col-form-label">Thời gian đặt</label>
          <div className="col-sm-9">
            <DatePicker 
              selected={form.bookingDate} 
              onChange={handleDateChange} 
              showTimeSelect 
              timeFormat="HH:mm" 
              timeIntervals={30} 
              dateFormat="dd/MM/yyyy HH:mm" 
              className="form-control" 
            />
          </div>
        </div>
      </div>

      <h4 className="mt-4">Chọn bàn</h4>
      <TableSelection 
        tables={tables} 
        selectedTableId={form.selectedTableId} 
        guests={form.guests} 
        onSelect={handleSelectTable} 
      />

      <h4 className="mt-5">Chọn món ăn</h4>
      <DishList 
        dishes={dishes} 
        preOrderDishes={preOrderDishes} 
        onQuantityChange={updateDishQuantity}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Pre-order summary */}
      {preOrderDishes.length > 0 && (
        <div className="pre-order-summary mt-4 p-3 bg-light rounded">
          <h5>Món đã chọn:</h5>
          <div className="row">
            {preOrderDishes.filter(dish => dish.quantity > 0).map((dish) => (
              <div key={dish.dishId} className="col-md-6 mb-2">
                <div className="d-flex justify-content-between">
                  <span>{dish.name} x{dish.quantity}</span>
                  <span className="fw-bold">{(dish.price * dish.quantity).toLocaleString()}₫</span>
                </div>
              </div>
            ))}
          </div>
          <hr />
          <div className="d-flex justify-content-between fs-5">
            <strong>Tổng cộng:</strong>
            <strong className="text-primary">{totalPreOrderAmount.toLocaleString()}₫</strong>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          className="btn btn-primary px-5 py-2 mt-3"
          onClick={handleBooking}
          disabled={loading || !form.selectedTableId}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          ) : (
            'Xác nhận đặt bàn'
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingPage;