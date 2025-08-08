// searchApi.ts - Enhanced version for better integration
import axiosConfig from './axiosConfigUser';

export interface DishSearchResult {
  id: number;
  dishId?: number;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: string;
  isAvailable: boolean;
  averageRating?: number;
  totalReviews?: number;
  orderCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchFilters {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availableOnly?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginationParams {
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

class EnhancedSearchAPI {
  private baseURL = '/api/v1/dishes';

  // === BASIC SEARCH METHODS ===
  
  async searchByName(keyword: string): Promise<{ data: DishSearchResult[] }> {
    const response = await axiosConfig.get(`${this.baseURL}/search`, {
      params: { keyword }
    });
    return { data: response.data };
  }

  async searchAdvanced(keyword: string): Promise<{ data: DishSearchResult[] }> {
    const response = await axiosConfig.get(`${this.baseURL}/search/advanced`, {
      params: { keyword }
    });
    return { data: response.data };
  }

  async searchByCategory(category: string): Promise<{ data: DishSearchResult[] }> {
    const response = await axiosConfig.get(`${this.baseURL}/search/category`, {
      params: { category }
    });
    return { data: response.data };
  }

  async searchByPriceRange(minPrice: number, maxPrice: number): Promise<{ data: DishSearchResult[] }> {
    const response = await axiosConfig.get(`${this.baseURL}/search/price`, {
      params: { minPrice, maxPrice }
    });
    return { data: response.data };
  }

  async searchWithFilters(filters: SearchFilters): Promise<{ data: DishSearchResult[] }> {
    const params: any = {};
    
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;

    const response = await axiosConfig.get(`${this.baseURL}/search/filters`, { params });
    return { data: response.data };
  }

  async searchSuggestions(keyword: string): Promise<{ data: DishSearchResult[] }> {
    const response = await axiosConfig.get(`${this.baseURL}/search/suggestions`, {
      params: { keyword }
    });
    return { data: response.data };
  }

  async getAllDishes(): Promise<{ data: DishSearchResult[] }> {
    const response = await axiosConfig.get(`${this.baseURL}/all`);
    return { data: response.data };
  }

  // === PAGINATED SEARCH METHODS ===

  async searchDishes(params: PaginationParams & { query?: string }): Promise<{ data: PaginatedResponse<DishSearchResult> }> {
    const searchParams: any = {
      page: params.page || 0,
      size: params.size || 12,
      sortBy: params.sortBy || 'createdAt',
      sortDir: params.sortDir || 'desc'
    };
    
    if (params.query) {
      searchParams.query = params.query;
    }

    const response = await axiosConfig.get(this.baseURL, { params: searchParams });
    return { data: response.data };
  }

  async findByCategory(category: string, params: PaginationParams): Promise<{ data: PaginatedResponse<DishSearchResult> }> {
    const searchParams = {
      page: params.page || 0,
      size: params.size || 12
    };

    const response = await axiosConfig.get(`${this.baseURL}/category/${category}`, { 
      params: searchParams 
    });
    return { data: response.data };
  }

  async findAvailableDishes(params: PaginationParams = {}): Promise<{ data: PaginatedResponse<DishSearchResult> }> {
    const searchParams = {
      page: params.page || 0,
      size: params.size || 12
    };

    const response = await axiosConfig.get(`${this.baseURL}/available`, { 
      params: searchParams 
    });
    return { data: response.data };
  }

  async findByPriceRange(
    minPrice: number, 
    maxPrice: number, 
    params: PaginationParams = {}
  ): Promise<{ data: PaginatedResponse<DishSearchResult> }> {
    const searchParams = {
      minPrice,
      maxPrice,
      page: params.page || 0,
      size: params.size || 12
    };

    const response = await axiosConfig.get(`${this.baseURL}/price-range`, { 
      params: searchParams 
    });
    return { data: response.data };
  }

  async findHighRatedDishes(minRating: number = 4.0): Promise<{ data: DishSearchResult[] }> {
    const response = await axiosConfig.get(`${this.baseURL}/top-rated`, {
      params: { minRating }
    });
    return { data: response.data };
  }

  async getDishById(id: number): Promise<{ data: DishSearchResult }> {
    const response = await axiosConfig.get(`${this.baseURL}/${id}`);
    return { data: response.data };
  }

  // === SMART SEARCH METHOD ===
  
  async smartSearch(filters: SearchFilters & PaginationParams): Promise<{ data: PaginatedResponse<DishSearchResult> | DishSearchResult[] }> {
    try {
      // If we have pagination params, use paginated search
      if (filters.page !== undefined || filters.size !== undefined) {
        return await this.searchDishes({
          query: filters.keyword,
          page: filters.page,
          size: filters.size,
          sortBy: filters.sortBy,
          sortDir: filters.sortDir
        });
      }

      // For specific filters, use appropriate endpoints
      if (filters.category && !filters.keyword && !filters.minPrice && !filters.maxPrice) {
        return await this.searchByCategory(filters.category);
      }

      if (filters.minPrice && filters.maxPrice && !filters.keyword && !filters.category) {
        return await this.searchByPriceRange(filters.minPrice, filters.maxPrice);
      }

      if (filters.keyword && (filters.category || filters.minPrice || filters.maxPrice)) {
        return await this.searchWithFilters(filters);
      }

      if (filters.keyword) {
        return await this.searchAdvanced(filters.keyword);
      }

      // Default to all dishes
      return await this.getAllDishes();
      
    } catch (error) {
      console.error('Smart search failed:', error);
      throw error;
    }
  }

  // === SYNC METHODS ===

  async syncAllDishes(): Promise<{ message: string }> {
    const response = await axiosConfig.post(`${this.baseURL}/sync/all`);
    return { message: response.data };
  }

  async syncDish(dishId: number): Promise<{ message: string }> {
    const response = await axiosConfig.post(`${this.baseURL}/sync/${dishId}`);
    return { message: response.data };
  }

  async syncDishesByCategory(category: string): Promise<{ message: string }> {
    const response = await axiosConfig.post(`${this.baseURL}/sync/category`, {
      params: { category }
    });
    return { message: response.data };
  }

  async deleteDishFromIndex(dishId: number): Promise<{ message: string }> {
    const response = await axiosConfig.delete(`${this.baseURL}/sync/${dishId}`);
    return { message: response.data };
  }

  // === UTILITY METHODS ===

  async getSearchStatistics(): Promise<{
    totalDishes: number;
    categories: string[];
    priceRange: { min: number; max: number };
    avgRating: number;
  }> {
    try {
      const dishes = await this.getAllDishes();
      const dishList = dishes.data;

      const categories = Array.from(new Set(dishList.map(d => d.category)));
      const prices = dishList.map(d => d.price);
      const ratings = dishList.filter(d => d.averageRating).map(d => d.averageRating!);

      return {
        totalDishes: dishList.length,
        categories,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        },
        avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
      };
    } catch (error) {
      console.error('Error getting search statistics:', error);
      return {
        totalDishes: 0,
        categories: [],
        priceRange: { min: 0, max: 0 },
        avgRating: 0
      };
    }
  }

  // === AUTOCOMPLETE & SUGGESTIONS ===

  async getAutocompleteSuggestions(keyword: string, limit: number = 5): Promise<string[]> {
    try {
      if (keyword.length < 2) return [];
      
      const response = await this.searchSuggestions(keyword);
      return response.data
        .slice(0, limit)
        .map(dish => dish.name);
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      return [];
    }
  }

  async getPopularSearches(): Promise<string[]> {
    try {
      const response = await this.findHighRatedDishes(4.0);
      return response.data
        .slice(0, 10)
        .map(dish => dish.name);
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  }
}

// Create singleton instance
const enhancedSearchAPI = new EnhancedSearchAPI();

export default enhancedSearchAPI;

// Legacy exports for backward compatibility
export const searchByName = enhancedSearchAPI.searchByName.bind(enhancedSearchAPI);
export const searchAdvanced = enhancedSearchAPI.searchAdvanced.bind(enhancedSearchAPI);
export const searchByCategory = enhancedSearchAPI.searchByCategory.bind(enhancedSearchAPI);
export const searchByPriceRange = enhancedSearchAPI.searchByPriceRange.bind(enhancedSearchAPI);
export const searchWithFilters = enhancedSearchAPI.searchWithFilters.bind(enhancedSearchAPI);
export const searchSuggestions = enhancedSearchAPI.searchSuggestions.bind(enhancedSearchAPI);
export const getAllDishes = enhancedSearchAPI.getAllDishes.bind(enhancedSearchAPI);
export const findHighRatedDishes = enhancedSearchAPI.findHighRatedDishes.bind(enhancedSearchAPI);
export const findAvailableDishes = enhancedSearchAPI.findAvailableDishes.bind(enhancedSearchAPI);
export const getDishById = enhancedSearchAPI.getDishById.bind(enhancedSearchAPI);
export const syncAllDishes = enhancedSearchAPI.syncAllDishes.bind(enhancedSearchAPI);
export const syncDish = enhancedSearchAPI.syncDish.bind(enhancedSearchAPI);
export const syncDishesByCategory = enhancedSearchAPI.syncDishesByCategory.bind(enhancedSearchAPI);
export const deleteDishFromIndex = enhancedSearchAPI.deleteDishFromIndex.bind(enhancedSearchAPI);