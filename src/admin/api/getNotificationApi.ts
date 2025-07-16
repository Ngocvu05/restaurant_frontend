import axiosConfig from '../../api/axiosConfig';

const api = axiosConfig.create({});

export const getNotificationApi = {
  getAll: () => api.get('/admin/notifications'),
  getLimited: (limit: number) => api.get(`/admin/notifications?limit=${limit}`),
  readNotification: (id: number) => api.put(`/admin/notifications/${id}/mark-read`),
};