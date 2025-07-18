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

const DishList = ({ dishes, preOrderDishes, onQuantityChange, selectedCategory, setSelectedCategory }: any) => {
  const categories = useMemo(() => Array.from(new Set(dishes.map((dish: Dish) => dish.category))), [dishes]);
  const filteredDishes = selectedCategory
    ? dishes.filter((d: Dish) => d.category === selectedCategory)
    : dishes;
  return (
    <>
      <div className="category-filter mb-3">
        <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => setSelectedCategory(null)}>Tất cả</button>
        {Array.from(categories as string[]).map((cat) => (
          <button key={cat} className="btn btn-outline-secondary btn-sm me-2" onClick={() => setSelectedCategory(cat)}>{cat}</button>
        ))}
      </div>
      <div className="dish-list row">
        {filteredDishes.map((dish: Dish) => {
          const selected = preOrderDishes.find((d: PreOrderDish) => d.dishId === dish.id);
          return (
            <div className="col-md-4 mb-4" key={dish.id}>
              <div className="card h-100">
                <img src={dish.imageUrls?.[0]} alt={dish.name} className="card-img-top" />
                <div className="card-body">
                  <h5 className="card-title">{dish.name}</h5>
                  <p className="card-text">{dish.description}</p>
                  <p className="fw-bold">{dish.price.toLocaleString()}₫</p>
                  <label>
                    Số lượng:
                    <input type="number" min={0} className="form-control mt-1" value={selected?.quantity || 0} onChange={(e) => onQuantityChange(dish.id, parseInt(e.target.value))} />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
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
    selectedCategory: null as string | null,
  });
  const [preOrderDishes, setPreOrderDishes] = useState<PreOrderDish[]>([]);
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
  const handleCategoryChange = (cat: string | null) => setForm(f => ({ ...f, selectedCategory: cat }));

  const updateDishQuantity = (dishId: number, quantity: number) => {
    const dish = dishes.find((d) => d.id === dishId);
    if (!dish) return;
    setPreOrderDishes((prev) => {
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
            <DatePicker selected={form.bookingDate} onChange={handleDateChange} showTimeSelect timeFormat="HH:mm" timeIntervals={30} dateFormat="dd/MM/yyyy HH:mm" className="form-control" />
          </div>
        </div>
      </div>
      <h4 className="mt-4">Chọn bàn</h4>
      <TableSelection tables={tables} selectedTableId={form.selectedTableId} guests={form.guests} onSelect={handleSelectTable} />
      <h4 className="mt-4">Chọn món ăn</h4>
      <DishList dishes={dishes} preOrderDishes={preOrderDishes} onQuantityChange={updateDishQuantity} selectedCategory={form.selectedCategory} setSelectedCategory={handleCategoryChange} />
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
