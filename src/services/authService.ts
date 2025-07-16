import api from '../api/axiosConfig';

export const login = (data: { username: string; password: string }) =>
  api.post(`/auth/login`, data);

export const register = (data: {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
}) => api.post(`/auth/register`, data);