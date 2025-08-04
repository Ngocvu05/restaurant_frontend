import axiosConfig from '../../api/axiosConfigUser';

const api = axiosConfig.create({
  baseURL: 'http://localhost:8080/users/api/v1/admin/users',
  withCredentials: true, // send cookie
  timeout: 10000, // time out
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
  },
});

const userApi = {
  // ✅ Lấy tất cả user
  getAll: () => api.get<UserDTO[]>('/'),

  // ✅ Lấy user theo id
  getById: (id: number) => api.get<UserDTO>(`/${id}`),

  // ✅ Tạo user mới
  create: (data: UserDTO) => api.post<UserDTO>('/', data),

  // ✅ Cập nhật user theo id
  update: (id: number, data: UserDTO) => api.put<UserDTO>(`/${id}`, data),

  // ✅ Xoá user theo id
  delete: (id: number) => api.delete<string>(`/${id}`),
};

export default userApi;

export const getUserInfoApi = {
  get: () => api.get('/auth/me'),
};

export type RoleName = 'ADMIN' | 'CUSTOMER' | 'STAFF';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserDTO {
  id?: number;
  username: string;
  password?: string;
  fullName?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  roleType: RoleName;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}