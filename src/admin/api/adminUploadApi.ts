import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/users/api/v1',
  withCredentials: true, // Send cookies with requests
  timeout: 10000, // Time out in milliseconds
});

// 🟢 Add interceptor để luôn lấy token mới nhất
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const adminUploadApi = {
//   getAll: () => axiosConfig.get('/admin/dishes'),
//   getById: (id: number) => axiosConfig.get(`/admin/dishes/${id}`),
//  update: (id: number, data: any) => axiosConfig.put(`/admin/dishes/${id}`, data),
//   delete: (id: number) => axiosConfig.delete(`/admin/dishes/${id}`),
    create: (formData: FormData) => api.post('/admin/uploads/images-dish', formData),
    deleteByUrl: (url: string) => api.delete('/admin/uploads/images-dish', { 
        params: { url } ,
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
    }),
};
