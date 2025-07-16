import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Carousel = () => {
  return (
    <Swiper
      modules={[Autoplay, Navigation, Pagination]}
      spaceBetween={50}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000 }}
      loop={true}
    >
      <SwiperSlide><img src="/assets/images/slide-01.jpg" alt="Slide 1" /></SwiperSlide>
      <SwiperSlide><img src="/assets/images/slide-02.jpg" alt="Slide 2" /></SwiperSlide>
      <SwiperSlide><img src="/assets/images/slide-03.jpg" alt="Slide 3" /></SwiperSlide>
    </Swiper>
  );
};

export default Carousel;
