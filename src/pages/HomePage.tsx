import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { motion } from 'framer-motion';
import api from '../api/axiosConfig';
import '../assets/css/HomePage.css';
import { Link } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';

interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrls: string;
  createdAt: string;
  orderCount?: number;
}


const HomePage: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [bestSellersState, setBestSellersState] = useState<Dish[]>([]);
  const { setLoading } = useLoading();

useEffect(() => {
  setLoading(true);

  const fetchDishes = api.get('/home/dishes');
  const fetchPopularDishes = api.get('/home/popular-dishes');

  Promise.allSettled([fetchDishes, fetchPopularDishes])
    .then(results => {
      const [dishesResult, popularDishesResult] = results;

      if (dishesResult.status === 'fulfilled') {
        setDishes(dishesResult.value.data);
      } else {
        console.warn('Lỗi khi lấy danh sách món ăn:', dishesResult.reason);
      }

      if (popularDishesResult.status === 'fulfilled') {
        setBestSellersState(popularDishesResult.value.data);
      } else {
        console.warn('Lỗi khi lấy món ăn phổ biến:', popularDishesResult.reason);
      }
    })
    .finally(() => setLoading(false));
}, []);

  const newDishes = [...dishes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
  
  // Lấy 6 món ăn mới nhất
  return (
    <div style={{ paddingTop: '120px' }}>
      {/* Hero Swiper Banner */}
      <Swiper
        autoplay={{ delay: 4000 }}
        pagination={{ clickable: true }}
        loop
        className="hero-swiper"
      >
        <SwiperSlide>
          <div className="hero-slide" style={{ backgroundImage: 'url(/assets/images/slide-01.jpg)' }}>
            <div className="hero-text">
              <h2>Chào mừng đến với <span>Klassy Cafe</span></h2>
              <p>Trải nghiệm ẩm thực đẳng cấp với không gian sang trọng và món ăn tinh tế.</p>
              <Link to="/booking" className="btn btn-primary mt-3">Đặt bàn ngay</Link>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="hero-slide" style={{ backgroundImage: 'url(/assets/images/slide-02.jpg)' }}>
            <div className="hero-text">
              <h2>Món mới mỗi ngày</h2>
              <p>Khám phá những hương vị mới lạ và hấp dẫn đến từ các đầu bếp tài hoa.</p>
              <Link to="/menu" className="btn btn-outline-light mt-3">Xem menu</Link>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>

      {/* Món ăn được đặt nhiều */}
      <section className="container py-5">
        <h3 className="text-center mb-4">Món ăn phổ biến nhất</h3>
        <div className="row">
          {bestSellersState.map((dish, idx) => (
            <motion.div
              className="col-md-4 mb-4"
              key={dish.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="card h-100">
                <img src={dish.imageUrls[0]} alt={dish.name} className="card-img-top" />
                <div className="card-body">
                  <h5 className="card-title">{dish.name}</h5>
                  <p className="card-text">{dish.description}</p>
                  <p className="fw-bold">{dish.price.toLocaleString()}₫</p>
                  <span className="badge bg-success">{dish.orderCount} lượt đặt</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Món ăn mới ra mắt */}
      <section className="container py-5 bg-light">
        <h3 className="text-center mb-4">Món ăn mới ra mắt</h3>
        <div className="row">
          {newDishes.map((dish, idx) => (
            <motion.div
              className="col-md-4 mb-4"
              key={dish.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="card h-100">
                <img src={dish.imageUrls[0]} alt={dish.name} className="card-img-top" />
                <div className="card-body">
                  <h5 className="card-title">{dish.name}</h5>
                  <p className="card-text">{dish.description}</p>
                  <span className="badge bg-warning text-dark">Món mới</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <div className="cta-section text-white text-center py-5" style={{ background: 'url(/assets/images/reservation-bg.jpg)', backgroundSize: 'cover' }}>
        <h2 className="mb-3">Bạn đã sẵn sàng thưởng thức chưa?</h2>
        <Link to="/booking" className="btn btn-light px-4 py-2">Đặt bàn ngay</Link>
      </div>
    </div>
  );
};

export default HomePage;
