import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axiosConfigUser';
import '../assets/css/templatemo-klassy-cafe.css';
import { useLoading } from '../context/LoadingContext';

const loginSchema = yup.object().shape({
  username: yup.string().required('Vui lòng nhập tên đăng nhập'),
  password: yup.string().required('Vui lòng nhập mật khẩu'),
});

const LoginPage: React.FC = () => {
  const { setLoading } = useLoading();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) navigate('/');
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
      data.sessionId = sessionStorage.getItem('chat-session-id') || '';
      setLoading(true);
    try {
      console.log("Data submit form login",data)
      const response = await api.post('/auth/login', data);      
      const { token, username: name, role, avatarUrl, fullname } = response.data;
      console.log("Login Respone data: ",response.data);
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('username', name);
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('fullname', fullname);
      sessionStorage.setItem('email', response.data.email);
      sessionStorage.setItem("refreshToken", response.data.refreshToken);
      sessionStorage.setItem('userId', response.data.userId);     
            
      if (avatarUrl) sessionStorage.setItem('avatar', avatarUrl);
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setError('username', { message: 'Tài khoản hoặc mật khẩu không đúng' });
      setError('password', { message: ' ' });
    }finally {
      setLoading(false);
    }
  };

  return (
    <section className="reservation-form bg-light py-5">
      <div className="container page-content">
        <div className="row">
          <div className="col-lg-6 offset-lg-3">
            <div className="section-heading text-center">
              <h2>Đăng nhập</h2>
              <span>Chào mừng bạn quay trở lại!</span>
            </div>
            <form id="login" onSubmit={handleSubmit(onSubmit)}>
              <div className="row">
                <div className="col-lg-12">
                  <fieldset>
                    <input
                      type="text"
                      placeholder="Tên đăng nhập"
                      className="form-control"
                      {...register('username')}
                    />
                    {errors.username && <p className="text-danger small">{errors.username.message}</p>}
                  </fieldset>
                </div>
                <div className="col-lg-12">
                  <fieldset>
                    <input
                      type="password"
                      placeholder="Mật khẩu"
                      className="form-control"
                      {...register('password')}
                    />
                    {errors.password && <p className="text-danger small">{errors.password.message}</p>}
                  </fieldset>
                </div>
                <div className="col-lg-12">
                  <fieldset>
                    <button type="submit" className="main-button-icon">
                      Đăng nhập
                    </button>
                  </fieldset>
                </div>
                <div className="col-lg-12 text-center mt-3">
                  <span>Bạn chưa có tài khoản? <a href="/register">Đăng ký</a></span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;