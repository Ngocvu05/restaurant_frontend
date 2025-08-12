import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi, LoginRequest } from '../api/authApi';
import '../assets/css/templatemo-klassy-cafe.css';
import { useLoading } from '../context/LoadingContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import OAuth2LoginButtons from '../components/OAuth2LoginButtons';
import FacebookErrorBoundary from '../components/FacebookErrorBoundary';

const loginSchema = yup.object().shape({
  username: yup.string().required('Vui lòng nhập tên đăng nhập'),
  password: yup.string().required('Vui lòng nhập mật khẩu'),
});

const LoginPage: React.FC = () => {
  const { setLoading, loading } = useLoading();
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra xem user đã đăng nhập chưa
    if (authApi.isAuthenticated()) {
      const currentUser = authApi.getCurrentUser();
      if (currentUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    // Thêm sessionId nếu có
    data.sessionId = sessionStorage.getItem('chat-session-id') || '';
    
    setLoading(true);
    clearErrors(); // Clear previous errors
    
    try {
      console.log("🔐 Login form data:", data);
      
      const response = await authApi.login(data);
      console.log("✅ Login successful:", response);
      
      // Navigate based on role
      if (response.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error("❌ Login failed:", error);
      setError('username', { message: 'Tài khoản hoặc mật khẩu không đúng' });
      setError('password', { message: ' ' });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth2Success = async (oauthResponse: any) => {
    setLoading(true);
    try {
      console.log("🔐 OAuth2 response:", oauthResponse);
      
      const response = await authApi.oauth2Login(oauthResponse);
      console.log("✅ OAuth2 login successful:", response);
      
      // Navigate based on role
      if (response.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error("❌ OAuth2 login failed:", error);
      handleOAuth2Error(error.message || 'OAuth2 đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOAuth2Error = (error: string) => {
    console.error("❌ OAuth2 error:", error);
    setError('username', { message: error });
    setError('password', { message: ' ' });
  };

  // Check if Google Client ID is available
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
  if (!googleClientId) {
    console.warn('⚠️ Google Client ID not configured');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || "YOUR_GOOGLE_CLIENT_ID"}>
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
                        className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                        {...register('username')}
                        autoComplete="username"
                      />
                      {errors.username && (
                        <p className="text-danger small mt-1">{errors.username.message}</p>
                      )}
                    </fieldset>
                  </div>
                  <div className="col-lg-12">
                    <fieldset>
                      <input
                        type="password"
                        placeholder="Mật khẩu"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        {...register('password')}
                        autoComplete="current-password"
                      />
                      {errors.password && (
                        <p className="text-danger small mt-1">{errors.password.message}</p>
                      )}
                    </fieldset>
                  </div>
                  <div className="col-lg-12">
                    <fieldset>
                      <button 
                        type="submit" 
                        className="main-button-icon"
                        disabled={loading}
                      >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                      </button>
                    </fieldset>
                  </div>
                </div>
              </form>

              {/* OAuth2 Login Buttons with Error Boundary */}
              <FacebookErrorBoundary>
                <OAuth2LoginButtons 
                  onSuccess={handleOAuth2Success}
                  onError={handleOAuth2Error}
                  setLoading={setLoading}
                />
              </FacebookErrorBoundary>

              <div className="col-lg-12 text-center mt-3">
                <span>Bạn chưa có tài khoản? <a href="/register">Đăng ký</a></span>
              </div>

            </div>
          </div>
        </div>
      </section>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;