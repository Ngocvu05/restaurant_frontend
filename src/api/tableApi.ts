import axiosConfig from './axiosConfigUser';

const tableApi = {
  getAll: () => axiosConfig.get('/tables'),
};

export default tableApi;