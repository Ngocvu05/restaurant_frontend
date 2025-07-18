import axiosConfig from './axiosConfigUser';

// Gọi danh sách món ăn
export const fetchDishes = async () => {
  const response = await axiosConfig.get('/dishes');
  return response.data;
};
