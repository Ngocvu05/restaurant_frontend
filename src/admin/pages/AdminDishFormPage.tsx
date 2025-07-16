import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminDishApi } from '../api/adminDishApi';
import ImageUploader from '../components/ImageUploader';
import { adminUploadApi } from '../api/adminUploadApi';

const AdminDishFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    imageUrls: [] as string[],
    description: '',
    category: '',
  });

  const [temporaryUploadedImages, setTemporaryUploadedImages] = useState<string[]>([]);

  // ✅ Thêm ảnh sau khi upload
  const handleImageUpload = (urls: string[]) => {
    const newUploads = urls.filter((url) => !formData.imageUrls.includes(url));
    setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUploads] }));
    setTemporaryUploadedImages((prev) => [...prev, ...newUploads]);
  };

  // ✅ Xoá ảnh cả khỏi formData và server (ImageUploader sẽ gọi ngược lại)
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

  // ✅ Lấy dữ liệu món ăn khi chỉnh sửa
  useEffect(() => {
    if (isEdit) {
      adminDishApi.getById(Number(id!)).then((res) => {
        const dish = res.data;
        setFormData({
          name: dish.name,
          price: dish.price,
          imageUrls: dish.imageUrls || [],
          description: dish.description || '',
          category: dish.category || '',
        });
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await adminDishApi.update(Number(id)!, formData);
        alert('Cập nhật món ăn thành công');
      } else {
        await adminDishApi.create(formData);
        alert('Thêm món ăn thành công');
      }
      navigate('/admin/dishes');
    } catch (err) {
      alert('Đã xảy ra lỗi!');
    }
  };

  // ✅ Khi quay lại và đang tạo mới => xoá các ảnh chưa được dùng
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

  return (
    <div className="container mt-4">
      <h2>{isEdit ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Tên món ăn</label>
          <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label>Giá</label>
          <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label>Ảnh món ăn</label>
          <input type="text" className="form-control mb-2" value={formData.imageUrls.join(', ')} disabled />
          <ImageUploader
            onUploadSuccess={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            defaultUrls={formData.imageUrls}
            allowMultiple
          />
        </div>
        <div className="mb-3">
          <label>Mô tả</label>
          <textarea name="description" className="form-control" value={formData.description} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label>Danh mục</label>
          <input type="text" name="category" className="form-control" value={formData.category} onChange={handleChange} />
        </div>

        <button type="submit" className="btn btn-success">
          {isEdit ? 'Cập nhật' : 'Thêm mới'}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={handleGoBack}>
          Quay lại
        </button>
      </form>
    </div>
  );
};

export default AdminDishFormPage;
