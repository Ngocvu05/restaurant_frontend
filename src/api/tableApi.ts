import axiosConfig from './axiosConfig';

const tableApi = {
  getAll: () => axiosConfig.get('/tables'),
};

export default tableApi;