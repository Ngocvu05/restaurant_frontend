import axiosConfig from '../../api/axiosConfig';

const api = axiosConfig.create({
  baseURL: 'http://localhost:8080/users/api/v1',
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
  },
});

export const getUserInfoApi = {
  get: () => api.get('/auth/me'),
};
