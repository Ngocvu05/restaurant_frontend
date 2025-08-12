import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi, RegisterRequest } from '../api/authApi';
import '../assets/css/templatemo-klassy-cafe.css';
import { useLoading } from '../context/LoadingContext';

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

type UsernameStatus = 'checking' | 'available' | 'taken' | null;

const RegisterPage: React.FC = () => {
  const { setLoading, loading } = useLoading();
  const navigate = useNavigate();
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
    setValue,
    watch,
  } = useForm<RegisterRequest>({
    resolver: yupResolver(registerSchema),
  });

  const watchedUsername = watch('username');

  // Debounced username check
  const checkUsername = useCallback(async (username: string) => {
      if (!username || username.length < 4) {
        setUsernameStatus(null);
        clearErrors('username');
        return;
      }

      setUsernameStatus('checking');
      try {
        const isAvailable = await authApi.checkUsername(username);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
        
        if (!isAvailable) {
          setError('username', { message: 'Tên đăng nhập đã tồn tại' });
        } else {
          clearErrors('username');
        }
      } catch (error: any) {
        console.error('❌ Username check error:', error);
        setUsernameStatus(null);
      }
    },
    [setError, clearErrors, setUsernameStatus]
  );

  // Check username when it changes
  useEffect(() => {
    const debouncedCheck = debounce((username: string) => checkUsername(username), 500);
    
    if (watchedUsername) {
      debouncedCheck(watchedUsername);
    }

    return () => {
      debouncedCheck.clear?.();
    };
  }, [watchedUsername, checkUsername]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('username', value);
    setUsernameStatus(null); // Reset status immediately
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Chỉ chấp nhận file ảnh');
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      console.log('🖼️ Avatar file selected:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB');
    }
  };

  const onSubmit = async (data: RegisterRequest) => {
    if (usernameStatus === 'taken') {
      setError('username', { message: 'Tên đăng nhập đã tồn tại' });
      return;
    }

    setLoading(true);
    
    try {
      console.log('📝 Registration form data:', data);
      console.log('🖼️ Avatar file:', avatarFile);

      const response = await authApi.register(data, avatarFile || undefined);
      console.log('✅ Registration successful:', response);
      
      alert('Đăng ký thành công!');
      
      // Nếu register trả về token, có thể auto-login
      if (response.token) {
        // User đã được auto-login, redirect based on role
        if (response.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      } else {
        // Redirect to login page
        navigate('/login');
      }
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      if (error.message?.includes('Tài khoản đã tồn tại') || error.message?.includes('exists')) {
        setError('username', { message: 'Tài khoản đã tồn tại' });
      } else {
        alert(error.message || 'Lỗi đăng ký. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getUsernameInputClass = () => {
    if (errors.username) return 'form-control is-invalid';
    if (usernameStatus === 'available') return 'form-control is-valid';
    if (usernameStatus === 'taken') return 'form-control is-invalid';
    return 'form-control';
  };

  const getUsernameStatusMessage = () => {
    if (usernameStatus === 'checking') {
      return <p className="text-info small mt-1">🔍 Đang kiểm tra...</p>;
    }
    if (usernameStatus === 'available' && !errors.username) {
      return <p className="text-success small mt-1">✅ Tên đăng nhập hợp lệ</p>;
    }
    if (usernameStatus === 'taken') {
      return <p className="text-danger small mt-1">❌ Tên đăng nhập đã được sử dụng</p>;
    }
    return null;
  };

  return (
    <section className="reservation-form bg-light py-5 page-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 offset-lg-2">
            <div className="section-heading text-center" style={{ paddingTop: '70px' }}>
              <h2>Đăng ký</h2>
              <span>Tạo tài khoản mới để đặt bàn</span>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
              <div className="row">
                <div className="col-md-6">
                  <fieldset className="mb-3">
                    <input
                      type="text"
                      placeholder="Tên đăng nhập"
                      className={getUsernameInputClass()}
                      {...register('username')}
                      onChange={handleUsernameChange}
                      autoComplete="username"
                    />
                    {errors.username && (
                      <p className="text-danger small mt-1">{errors.username.message}</p>
                    )}
                    {getUsernameStatusMessage()}
                  </fieldset>
                </div>
                
                <div className="col-md-6">
                  <fieldset className="mb-3">
                    <input 
                      type="password" 
                      placeholder="Mật khẩu" 
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      {...register('password')} 
                      autoComplete="new-password"
                    />
                    {errors.password && (
                      <p className="text-danger small mt-1">{errors.password.message}</p>
                    )}
                  </fieldset>
                </div>
                
                <div className="col-md-6">
                  <fieldset className="mb-3">
                    <input 
                      type="text" 
                      placeholder="Họ tên" 
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      {...register('fullName')} 
                      autoComplete="name"
                    />
                    {errors.fullName && (
                      <p className="text-danger small mt-1">{errors.fullName.message}</p>
                    )}
                  </fieldset>
                </div>
                
                <div className="col-md-6">
                  <fieldset className="mb-3">
                    <input 
                      type="email" 
                      placeholder="Email" 
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      {...register('email')} 
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="text-danger small mt-1">{errors.email.message}</p>
                    )}
                  </fieldset>
                </div>
                
                <div className="col-md-6">
                  <fieldset className="mb-3">
                    <input 
                      type="text" 
                      placeholder="Số điện thoại" 
                      className={`form-control ${errors.phone_number ? 'is-invalid' : ''}`}
                      {...register('phone_number')} 
                      autoComplete="tel"
                    />
                    {errors.phone_number && (
                      <p className="text-danger small mt-1">{errors.phone_number.message}</p>
                    )}
                  </fieldset>
                </div>
                
                <div className="col-md-6">
                  <fieldset className="mb-3">
                    <input 
                      type="text" 
                      placeholder="Địa chỉ" 
                      className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                      {...register('address')} 
                      autoComplete="address"
                    />
                    {errors.address && (
                      <p className="text-danger small mt-1">{errors.address.message}</p>
                    )}
                  </fieldset>
                </div>
                
                <div className="col-md-6">
                  <fieldset className="mb-3">
                    <label className="form-label">Ảnh đại diện (tùy chọn):</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="form-control" 
                      onChange={handleAvatarChange} 
                    />
                    {avatarPreview && (
                      <div className="mt-2">
                        <img 
                          src={avatarPreview} 
                          alt="Avatar Preview" 
                          style={{ 
                            height: 80, 
                            width: 80, 
                            objectFit: 'cover', 
                            borderRadius: '50%',
                            border: '2px solid #ddd'
                          }} 
                        />
                      </div>
                    )}
                  </fieldset>
                </div>
                
                <div className="col-12 mt-3">
                  <button 
                    type="submit" 
                    className="main-button-icon w-100"
                    disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                  >
                    {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                  </button>
                </div>
                
                <div className="col-12 text-center mt-3">
                  <span>Đã có tài khoản? <a href="/login">Đăng nhập</a></span>
                </div>
              </div>
            </form>

            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 p-3 bg-light border rounded">
                <small className="text-muted">
                  <strong>Debug Info:</strong><br />
                  Username Status: {usernameStatus || 'null'}<br />
                  Avatar File: {avatarFile ? `${avatarFile.name} (${(avatarFile.size / 1024).toFixed(2)}KB)` : 'None'}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): { (...args: Parameters<T>): void; clear: () => void } {
  let timeout: NodeJS.Timeout;
  
  const debouncedFn = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debouncedFn.clear = () => {
    clearTimeout(timeout);
  };

  return debouncedFn;
}

export default RegisterPage;