import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/search/api/v1',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor để luôn lấy token mới nhất
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor để handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Search API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface DishSearchResult {
  id: number;
  dishId: number;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  category: string;
  imageUrls: string[];
  averageRating: number;
  totalReviews: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchResult {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  roleName: string;
  status: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSearchResult {
  id: number;
  reviewId: number;
  dishId: number;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchParams {
  query?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const searchApi = {
  // ==================== DISH SEARCH APIs ====================
  
  // Tìm kiếm cơ bản theo tên
  searchDishesByName: (keyword: string) =>
    api.get<DishSearchResult[]>(`/dishes/search?keyword=${encodeURIComponent(keyword)}`),
  
  // Tìm kiếm nâng cao
  searchDishesAdvanced: (keyword: string) =>
    api.get<DishSearchResult[]>(`/dishes/search/advanced?keyword=${encodeURIComponent(keyword)}`),
  
  // Tìm kiếm theo danh mục
  searchDishesByCategory: (category: string) =>
    api.get<DishSearchResult[]>(`/dishes/search/category?category=${encodeURIComponent(category)}`),
  
  // Tìm kiếm theo khoảng giá
  searchDishesByPriceRange: (minPrice: number, maxPrice: number) =>
    api.get<DishSearchResult[]>(`/dishes/search/price?minPrice=${minPrice}&maxPrice=${maxPrice}`),
  
  // Tìm kiếm với filter
  searchDishesWithFilters: (params: {
    keyword: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    let url = `/dishes/search/filters?keyword=${encodeURIComponent(params.keyword)}`;
    if (params.category) url += `&category=${encodeURIComponent(params.category)}`;
    if (params.minPrice) url += `&minPrice=${params.minPrice}`;
    if (params.maxPrice) url += `&maxPrice=${params.maxPrice}`;
    return api.get<DishSearchResult[]>(url);
  },
  
  // Gợi ý tìm kiếm
  searchSuggestions: (keyword: string) => 
    api.get<DishSearchResult[]>(`/dishes/search/suggestions?keyword=${encodeURIComponent(keyword)}`),
  
  // Lấy tất cả món ăn
  getAllDishes: () => api.get<DishSearchResult[]>('/dishes/all'),
  
  // Tìm kiếm có phân trang
  searchDishes: (params: SearchParams) => {
    let url = '/dishes?';
    if (params.query) url += `query=${encodeURIComponent(params.query)}&`;
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    if (params.sortBy) url += `sortBy=${params.sortBy}&`;
    if (params.sortDir) url += `sortDir=${params.sortDir}&`;
    return api.get<PaginatedResponse<DishSearchResult>>(url);
  },
  
  // Tìm theo danh mục có phân trang
  findDishesByCategory: (category: string, params: SearchParams = {}) => {
    let url = `/dishes/category/${encodeURIComponent(category)}?`;
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    return api.get<PaginatedResponse<DishSearchResult>>(url);
  },
  
  // Tìm món có sẵn
  findAvailableDishes: (params: SearchParams = {}) => {
    let url = '/dishes/available?';
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    return api.get<PaginatedResponse<DishSearchResult>>(url);
  },
  
  // Tìm theo khoảng giá có phân trang
  findDishesByPriceRange: (minPrice: number, maxPrice: number, params: SearchParams = {}) => {
    let url = `/dishes/price-range?minPrice=${minPrice}&maxPrice=${maxPrice}&`;
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    return api.get<PaginatedResponse<DishSearchResult>>(url);
  },
  
  // Tìm món được đánh giá cao
  findHighRatedDishes: (minRating: number = 4.0) =>
    api.get<DishSearchResult[]>(`/dishes/top-rated?minRating=${minRating}`),
  
  // Lấy món theo ID
  getDishById: (id: number) =>
    api.get<DishSearchResult>(`/dishes/${id}`),
  
  // ==================== USER SEARCH APIs ====================
  
  // Tìm kiếm user có phân trang
  searchUsers: (params: SearchParams) => {
    let url = '/users?';
    if (params.query) url += `query=${encodeURIComponent(params.query)}&`;
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    if (params.sortBy) url += `sortBy=${params.sortBy}&`;
    if (params.sortDir) url += `sortDir=${params.sortDir}&`;
    return api.get<PaginatedResponse<UserSearchResult>>(url);
  },
  
  // Tìm user theo role
  findUsersByRole: (roleName: string, params: SearchParams = {}) => {
    let url = `/users/role/${encodeURIComponent(roleName)}?`;
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    return api.get<PaginatedResponse<UserSearchResult>>(url);
  },
  
  // Tìm user theo status
  findUsersByStatus: (status: string, params: SearchParams = {}) => {
    let url = `/users/status/${encodeURIComponent(status)}?`;
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    return api.get<PaginatedResponse<UserSearchResult>>(url);
  },
  
  // Lấy user theo ID
  getUserById: (id: number) =>
    api.get<UserSearchResult>(`/users/${id}`),
  
  // Tìm user theo username
  findUserByUsername: (username: string) =>
    api.get<UserSearchResult>(`/users/username/${encodeURIComponent(username)}`),
  
  // Tìm user theo email
  findUserByEmail: (email: string) =>
    api.get<UserSearchResult>(`/users/email/${encodeURIComponent(email)}`),
  
  // ==================== REVIEW SEARCH APIs ====================
  
  // Tìm kiếm review có phân trang
  searchReviews: (params: SearchParams) => {
    let url = '/search/reviews?';
    if (params.query) url += `query=${encodeURIComponent(params.query)}&`;
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    if (params.sortBy) url += `sortBy=${params.sortBy}&`;
    if (params.sortDir) url += `sortDir=${params.sortDir}&`;
    return api.get<PaginatedResponse<ReviewSearchResult>>(url);
  },
  
  // Tìm review theo món ăn
  findReviewsByDish: (dishId: number, params: SearchParams = {}) => {
    let url = `/search/reviews/dish/${dishId}?`;
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    return api.get<PaginatedResponse<ReviewSearchResult>>(url);
  },
  
  // Tìm review active theo món ăn
  findActiveReviewsByDish: (dishId: number) =>
    api.get<ReviewSearchResult[]>(`/search/reviews/dish/${dishId}/active`),
  
  // Tìm review theo rating
  findReviewsByRating: (rating: number, params: SearchParams = {}) => {
    let url = `/search/reviews/rating/${rating}?`;
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    return api.get<PaginatedResponse<ReviewSearchResult>>(url);
  },
  
  // Tìm review active
  findActiveReviews: (params: SearchParams = {}) => {
    let url = '/search/reviews/active?';
    if (params.page !== undefined) url += `page=${params.page}&`;
    if (params.size !== undefined) url += `size=${params.size}&`;
    return api.get<PaginatedResponse<ReviewSearchResult>>(url);
  },
  
  // Lấy review theo ID
  getReviewById: (id: number) =>
    api.get<ReviewSearchResult>(`/search/reviews/${id}`),
  
  // ==================== SYNC APIs (for admin) ====================
  
  // Đồng bộ tất cả món ăn
  syncAllDishes: () => api.post('/dishes/sync/all'),
  
  // Đồng bộ món ăn theo ID
  syncDish: (dishId: number) => api.post(`/dishes/sync/${dishId}`),
  
  // Đồng bộ theo danh mục
  syncDishesByCategory: (category: string) => 
    api.post(`/dishes/sync/category?category=${encodeURIComponent(category)}`),
  
  // Xóa món ăn khỏi index
  deleteDishFromIndex: (dishId: number) => api.delete(`/dishes/sync/${dishId}`),
};

export default searchApi;