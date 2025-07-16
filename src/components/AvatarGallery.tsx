import React, { useEffect, useState } from 'react';
import { UserApi } from '../api/UserApi';
import { Spinner, Button } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import '../assets/css/AvatarGallery.css'; // Assuming you have a CSS file for styling

interface Image {
  id: number;
  url: string;
  avatar: boolean;
}

const AvatarGallery: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loadingMap, setLoadingMap] = useState<{ [id: number]: boolean }>({});

  const fetchImages = async () => {
    try {
      const res = await UserApi.getProfile();
      console.log("Response from getProfile:", res.data);
      const user = res.data;
      const imgs = user.images || [];
      console.log("Fetched images:", imgs);
      setImages(imgs);
      const avatarImg = imgs.find((img: Image) => img.avatar);
      console.log("Avatar image found:", avatarImg);
      if (avatarImg) setSelectedImage(avatarImg.url);
    } catch (err) {
      console.error('Lỗi khi lấy ảnh user:', err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleSetAvatar = async (imageId: number) => {
    try {
      setLoadingMap(prev => ({ ...prev, [imageId]: true }));
      await UserApi.setAvatar(imageId);
      await fetchImages();
      sessionStorage.setItem('avatar', images.find(img => img.id === imageId)?.url || '');
      
    } catch (err) {
      console.error('Lỗi khi đặt avatar:', err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [imageId]: false }));
    }
  };

  return (
    <div className="avatar-gallery container my-4">
      <h5 className="mb-3">Ảnh đại diện</h5>
      {selectedImage ? (
        <div className="main-avatar-preview mb-4">
          <img src={selectedImage} alt="Avatar preview" className="main-avatar-img" />
        </div>
      ) : (
        <p>Chưa có ảnh đại diện</p>
      )}

      <h6 className="mb-2">Ảnh đã tải lên</h6>
      <Swiper
        modules={[Navigation]}
        spaceBetween={10}
        slidesPerView={4}
        navigation
        className="avatar-swiper mb-3"
      >
        {images.map((img) => (
          <SwiperSlide key={img.id}>
            <div
              className={`thumb-wrapper ${img.url === selectedImage ? 'selected' : ''}`}
              onClick={() => setSelectedImage(img.url)}
            >
              <img src={img.url} alt="uploaded" className="thumb-image" />
            </div>
            <Button
              variant={img.avatar ? 'success' : 'outline-primary'}
              size="sm"
              className="w-100 mt-2"
              disabled={img.avatar || loadingMap[img.id]}
              onClick={() => handleSetAvatar(img.id)}
            >
              {loadingMap[img.id] ? (
                <Spinner animation="border" size="sm" />
              ) : img.avatar ? 'Ảnh hiện tại' : 'Đặt làm avatar'}
            </Button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default AvatarGallery;