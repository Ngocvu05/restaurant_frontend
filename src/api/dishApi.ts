import { usersApi } from './axiosConfigUser';

/**
 * Dishes API using the corrected users API instance
 * 
 * URL Pattern:
 * Frontend: /users/api/v1/home/dishes
 * -> usersApi baseURL: /users
 * -> Final URL: /users/api/v1/home/dishes
 * -> Nginx: /users/* -> Gateway: /users/*
 * -> Gateway receives: /users/api/v1/home/dishes
 */

// Gọi danh sách món ăn
export const fetchDishes = async () => {
  try {
    console.log('🍽️ Fetching dishes...');
    const response = await usersApi.get('/api/v1/home/dishes');
    console.log('✅ Dishes fetched successfully:', response.data?.length || 'N/A', 'items');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch dishes:', error);
    throw error;
  }
};

// Lấy món ăn phổ biến
export const fetchPopularDishes = async () => {
  try {
    console.log('🔥 Fetching popular dishes...');
    const response = await usersApi.get('/api/v1/home/popular-dishes');
    console.log('✅ Popular dishes fetched successfully:', response.data?.length || 'N/A', 'items');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch popular dishes:', error);
    throw error;
  }
};

// Lấy món ăn theo ID
export const fetchDishById = async (id: string) => {
  try {
    console.log('🔍 Fetching dish by ID:', id);
    const response = await usersApi.get(`/api/v1/dishes/${id}`);
    console.log('✅ Dish fetched successfully:', response.data?.name || 'N/A');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch dish by ID:', error);
    throw error;
  }
};

// Tìm kiếm món ăn
export const searchDishes = async (query: string) => {
  try {
    console.log('🔍 Searching dishes with query:', query);
    const response = await usersApi.get(`/api/v1/dishes/search?q=${encodeURIComponent(query)}`);
    console.log('✅ Dish search completed:', response.data?.length || 'N/A', 'results');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to search dishes:', error);
    throw error;
  }
};

// Debug utility - test API endpoint directly
export const testDishesEndpoint = async () => {
  try {
    console.log('🧪 Testing dishes endpoint...');
    
    // Test với absolute URL để bypass nginx
    const directTest = await fetch('http://localhost:8080/users/api/v1/home/dishes', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Direct API test result:', {
      ok: directTest.ok,
      status: directTest.status,
      statusText: directTest.statusText
    });
    
    if (directTest.ok) {
      const data = await directTest.json();
      console.log('📦 Direct API data:', data);
      return { success: true, data };
    }
    
    return { success: false, status: directTest.status };
  } catch (error) {
    console.error('❌ Direct API test failed:', error);
    return { success: false, error };
  }
};

// Enhanced dish API with retry logic
export const fetchDishesWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Fetching dishes (attempt ${attempt}/${maxRetries})...`);
      return await fetchDishes();
    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('💀 All attempts failed, throwing error');
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default {
  fetchDishes,
  fetchPopularDishes,
  fetchDishById,
  searchDishes,
  testDishesEndpoint,
  fetchDishesWithRetry
};