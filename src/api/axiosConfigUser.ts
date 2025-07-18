// src/api/axiosConfig.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/users/api/v1',
  withCredentials: true, // ✳️ Gửi cookie theo request
  timeout: 10000, // ✅ Thêm timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Chỉ đính token nếu KHÔNG phải là route public
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  const isPublic = config.url?.startsWith('/home');

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ Bắt lỗi token hết hạn và tự refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = sessionStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // ✅ FIX: Sử dụng instance api thay vì axios.post
          const res = await api.post('/auth/refresh-token', {
            refreshToken,
          });

          // ✅ Cập nhật token mới
          sessionStorage.setItem('token', res.data.token);

          // ✅ Gửi lại request cũ với token mới
          originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
          return api(originalRequest);
        } catch (refreshError) {
          sessionStorage.clear();
          window.location.href = '/login';
        }
      } else {
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;