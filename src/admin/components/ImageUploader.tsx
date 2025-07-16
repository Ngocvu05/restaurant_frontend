import React, { useRef, useState, useEffect } from 'react';
import { adminUploadApi } from '../api/adminUploadApi';

interface ImageUploaderProps {
  onUploadSuccess: (urls: string[]) => void;
  onRemoveImage?: (url: string) => void; // <- THÊM dòng này
  defaultUrls?: string[];
  allowMultiple?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({onUploadSuccess, defaultUrls, allowMultiple, 
  onRemoveImage // ✅ Thêm dòng này
}) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>(defaultUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
  if (defaultUrls && defaultUrls.length > 0) {
    setPreviewUrls(defaultUrls);
  }
}, [defaultUrls]);

// ✅ hàm xử lý upload ảnh
// ✅ sử dụng FormData để gửi file lên server
  const handleUpload = async () => {
  const files = fileInputRef.current?.files;
  if (!files || files.length === 0) return alert('Vui lòng chọn ảnh');

  const uploadedUrls: string[] = [];

  for (const file of Array.from(files)) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const res = await adminUploadApi.create(formData);
      uploadedUrls.push(res.data.imageUrl);
    } catch (err) {
      console.error('Upload failed for:', file.name);
    }
  }

  // Cập nhật previewUrls với các URL đã upload
  // Nếu có ảnh mới được upload thành công
  if (uploadedUrls.length > 0) {
    setPreviewUrls((prev) => [...prev, ...uploadedUrls]);
    onUploadSuccess(uploadedUrls);
  }

  setUploading(false);
};

// ✅ hàm xử lý xoá ảnh
// ✅ gọi API xoá ảnh theo URL
  const handleRemoveImage = async (url: string) => {
    try {
      await adminUploadApi.deleteByUrl(url);
      const newPreview = previewUrls.filter((u) => u !== url);
      setPreviewUrls(newPreview);
      onUploadSuccess(newPreview);
      onRemoveImage?.(url); // <- GỌI ngược lên để AdminDishFormPage biết
    } catch (err) {
      alert('Lỗi khi xoá ảnh khỏi server');
    }
  };

  
  return (
    <div className="mt-2">
      <label className="form-label">Chọn ảnh</label>
      {/* ✅ thêm thuộc tính accept để chỉ cho phép ảnh */}
      <input type="file" accept="image/*" ref={fileInputRef} className="form-control" multiple={allowMultiple}/>
      <button type="button" className="btn btn-primary mt-2" onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
      </button>

      <div className="mt-2 d-flex flex-wrap gap-2">
        {previewUrls.map((url) => (
          <div key={url} className="position-relative">
            <img
              src={url}
              alt="Preview"
              style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '5px' }}
            />
            <button
              type="button"
              className="btn btn-sm btn-danger position-absolute top-0 end-0"
              onClick={() => handleRemoveImage(url)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ImageUploader;
