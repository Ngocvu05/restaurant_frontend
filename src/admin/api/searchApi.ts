import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/search/api/v1',
  withCredentials: true, // Send cookies with requests
  timeout: 10000, // Time out in milliseconds
  headers: {
    'Content-Type': 'application/json',
    
  },
});

// 🟢 Add interceptor để luôn lấy token mới nhất
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const searchApi = {
  search: (keyword: string) =>
     api.get(`/dishes/search?keyword=${encodeURIComponent(keyword)}`),
  
  searchSuggestions: (keyword: string) => 
    api.get(`/dishes/search/suggestions?keyword=${encodeURIComponent(keyword)}`),
};