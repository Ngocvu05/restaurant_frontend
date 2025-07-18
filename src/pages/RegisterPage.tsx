import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axiosConfigUser';
import '../assets/css/templatemo-klassy-cafe.css';

const registerSchema = yup.object().shape({
  username: yup
    .string()
    .required('Vui lòng nhập tên đăng nhập')
    .min(4, 'Tên đăng nhập tối thiểu 4 ký tự'),
  password: yup
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .required('Vui lòng nhập mật khẩu'),
  fullName: yup.string().required('Vui lòng nhập họ tên'),
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  phone_number: yup.string().required('Vui lòng nhập số điện thoại'),
  address: yup.string().required('Vui lòng nhập địa chỉ'),
});

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) navigate('/');
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const checkUsername = async (username: string) => {
    if (!username || username.length < 4) {
      setUsernameAvailable(null);
      clearErrors('username');
      return;
    }
    try {
      const res = await api.get(`/auth/check-username?username=${username}`);
      const available = !res.data;
      setUsernameAvailable(available);
      if (available) {
        clearErrors('username');
      } else {
        setError('username', { message: 'Tên đăng nhập đã tồn tại' });
      }
    } catch (err) {
      setUsernameAvailable(null);
    }
  };

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('username', value);
    await checkUsername(value);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: any) => {
    if (usernameAvailable === false) {
      setError('username', { message: 'Tên đăng nhập đã tồn tại' });
      return;
    }
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => formData.append(key, String(value)));
      if (avatarFile) formData.append('avatar', avatarFile);

      await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Đăng ký thành công!');
      navigate('/login');
    } catch (error: any) {
      if (error.response?.data?.message?.includes('exists')) {
        setError('username', { message: 'Tài khoản đã tồn tại' });
      } else {
        alert('Lỗi đăng ký. Vui lòng thử lại.');
      }
    }
  };

  return (
    <section className="reservation-form bg-light py-5v page-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 offset-lg-2">
            <div className="section-heading text-center">
              <h2>Đăng ký</h2>
              <span>Tạo tài khoản mới để đặt bàn</span>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
              <div className="row">
                <div className="col-md-6">
                  <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    className="form-control"
                    {...register('username')}
                    onChange={handleUsernameChange}
                  />
                  {errors.username && <p className="text-danger small">{errors.username.message}</p>}
                  {usernameAvailable === true && !errors.username && (
                    <p className="text-success small">✔ Tên này hợp lệ</p>
                  )}
                </div>
                <div className="col-md-6">
                  <input type="password" placeholder="Mật khẩu" className="form-control" {...register('password')} />
                  {errors.password && <p className="text-danger small">{errors.password.message}</p>}
                </div>
                <div className="col-md-6">
                  <input type="text" placeholder="Họ tên" className="form-control" {...register('fullName')} />
                  {errors.fullName && <p className="text-danger small">{errors.fullName.message}</p>}
                </div>
                <div className="col-md-6">
                  <input type="email" placeholder="Email" className="form-control" {...register('email')} />
                  {errors.email && <p className="text-danger small">{errors.email.message}</p>}
                </div>
                <div className="col-md-6">
                  <input type="text" placeholder="Số điện thoại" className="form-control" {...register('phone_number')} />
                  {errors.phone_number && <p className="text-danger small">{errors.phone_number.message}</p>}
                </div>
                <div className="col-md-6">
                  <input type="text" placeholder="Địa chỉ" className="form-control" {...register('address')} />
                  {errors.address && <p className="text-danger small">{errors.address.message}</p>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Ảnh đại diện:</label>
                  <input type="file" accept="image/*" className="form-control" onChange={handleAvatarChange} />
                  {avatarPreview && <img src={avatarPreview} alt="Avatar Preview" style={{ height: 80, marginTop: 10 }} />}
                </div>
                <div className="col-12 mt-3">
                  <button type="submit" className="main-button-icon w-100">
                    Đăng ký
                  </button>
                </div>
                <div className="col-12 text-center mt-3">
                  <span>Đã có tài khoản? <a href="/login">Đăng nhập</a></span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
