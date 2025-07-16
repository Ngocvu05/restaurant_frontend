import axiosConfig from '../../api/axiosConfig';

export const adminDishApi = {
  getAll: () => axiosConfig.get('/admin/dishes'),
  getById: (id: number) => axiosConfig.get(`/admin/dishes/${id}`),
  create: (data: any) => axiosConfig.post('/admin/dishes', data),
  update: (id: number, data: any) => axiosConfig.put(`/admin/dishes/${id}`, data),
  delete: (id: number) => axiosConfig.delete(`/admin/dishes/${id}`),
};
