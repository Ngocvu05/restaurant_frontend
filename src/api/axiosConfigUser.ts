import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/users/api/v1',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    const isPublic = config.url?.startsWith('/home') || 
                    config.url?.includes('/auth/login') || 
                    config.url?.includes('/auth/register') ||
                    config.url?.includes('/auth/refresh-token');

    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý refresh token
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ API Error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    // Chỉ xử lý refresh token khi gặp 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = sessionStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          console.log('🔄 Attempting token refresh...');
          
          const refreshResponse = await api.post('/auth/refresh-token', {
            refreshToken: refreshToken
          });

          const newToken = refreshResponse.data.token;
          const newRefreshToken = refreshResponse.data.refreshToken;

          if (newToken) {
            // Cập nhật tokens
            sessionStorage.setItem('token', newToken);
            if (newRefreshToken) {
              sessionStorage.setItem('refreshToken', newRefreshToken);
            }

            // Cập nhật header cho request gốc
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            console.log('✅ Token refreshed successfully');
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          
          // Xóa tất cả tokens và redirect
          sessionStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.warn('⚠️ No refresh token available');
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;