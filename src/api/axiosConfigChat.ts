import axios from 'axios';

const chatApiInstance = axios.create({
  baseURL: 'http://localhost:8080/chat/api/v1',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

chatApiInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

chatApiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = sessionStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await chatApiInstance.post('http://localhost:8080/users/api/v1/auth/refresh-token', {
            refreshToken,
          });

          sessionStorage.setItem('token', res.data.token);
          originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
          return chatApiInstance(originalRequest);
        } catch (err) {
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

export default chatApiInstance;
