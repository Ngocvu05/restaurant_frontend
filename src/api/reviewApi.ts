import api from './axiosConfigUser';

export interface ReviewDTO {
  id?: number;
  dishId: number;
  customerName: string;
  customerEmail?: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  isActive?: boolean;
  isVerified?: boolean;
  ipAddress?: string;
  createdAt?: string;
  updatedAt?: string;
  dishName?: string;
  dishCategory?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ReviewResponse {
  success: boolean;
  message?: string;
  data: ReviewDTO | ReviewDTO[];
  pagination?: PaginationInfo;
}

export interface ReviewStatsResponse {
  success: boolean;
  data: ReviewStats;
}

// ====== Public Review APIs ======

/**
 * Create a new review for a dish
 */
export const createReview = async (dishId: number, reviewData: Partial<ReviewDTO>): Promise<ReviewDTO> => {
  try {
    const response = await api.post<ReviewResponse>(`/dishes/${dishId}/reviews`, reviewData);
    return response.data.data as ReviewDTO;
  } catch (error: any) {
    console.error('Error creating review:', error);
    throw new Error(error.response?.data?.message || 'Failed to create review');
  }
};

/**
 * Get all reviews for a specific dish with pagination
 */
export const getDishReviews = async (
  dishId: number,
  options: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    rating?: number;
    verified?: boolean;
  } = {}
): Promise<{ reviews: ReviewDTO[]; pagination: PaginationInfo }> => {
  try {
    const params = new URLSearchParams();
    if (options.page !== undefined) params.append('page', options.page.toString());
    if (options.size !== undefined) params.append('size', options.size.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortDir) params.append('sortDir', options.sortDir);
    if (options.rating !== undefined) params.append('rating', options.rating.toString());
    if (options.verified !== undefined) params.append('verified', options.verified.toString());

    const response = await api.get<ReviewResponse>(`/dishes/${dishId}/reviews?${params.toString()}`);
    
    return {
      reviews: response.data.data as ReviewDTO[],
      pagination: response.data.pagination!
    };
  } catch (error: any) {
    console.error('Error fetching dish reviews:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch reviews');
  }
};

/**
 * Get review statistics for a dish
 */
export const getDishReviewStats = async (dishId: number): Promise<ReviewStats> => {
  try {
    const response = await api.get<ReviewStatsResponse>(`/dishes/${dishId}/reviews/stats`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching review stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch review statistics');
  }
};

/**
 * Get a specific review by ID
 */
export const getReviewById = async (reviewId: number): Promise<ReviewDTO> => {
  try {
    const response = await api.get<ReviewResponse>(`/reviews/${reviewId}`);
    return response.data.data as ReviewDTO;
  } catch (error: any) {
    console.error('Error fetching review:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch review');
  }
};

// ====== Admin Review APIs (Optional) ======

/**
 * Get all reviews with filters (Admin only)
 */
export const getAllReviews = async (options: {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  dishId?: number;
  rating?: number;
  verified?: boolean;
} = {}): Promise<{ reviews: ReviewDTO[]; pagination: PaginationInfo }> => {
  try {
    const params = new URLSearchParams();
    if (options.page !== undefined) params.append('page', options.page.toString());
    if (options.size !== undefined) params.append('size', options.size.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortDir) params.append('sortDir', options.sortDir);
    if (options.dishId !== undefined) params.append('dishId', options.dishId.toString());
    if (options.rating !== undefined) params.append('rating', options.rating.toString());
    if (options.verified !== undefined) params.append('verified', options.verified.toString());

    const response = await api.get<ReviewResponse>(`/admin/reviews?${params.toString()}`);
    
    return {
      reviews: response.data.data as ReviewDTO[],
      pagination: response.data.pagination!
    };
  } catch (error: any) {
    console.error('Error fetching all reviews:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch reviews');
  }
};

/**
 * Update a review (Admin only)
 */
export const updateReview = async (reviewId: number, reviewData: Partial<ReviewDTO>): Promise<ReviewDTO> => {
  try {
    const response = await api.put<ReviewResponse>(`/admin/reviews/${reviewId}`, reviewData);
    return response.data.data as ReviewDTO;
  } catch (error: any) {
    console.error('Error updating review:', error);
    throw new Error(error.response?.data?.message || 'Failed to update review');
  }
};

/**
 * Delete a review (Admin only)
 */
export const deleteReview = async (reviewId: number): Promise<void> => {
  try {
    await api.delete<ReviewResponse>(`/admin/reviews/${reviewId}`);
  } catch (error: any) {
    console.error('Error deleting review:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete review');
  }
};

/**
 * Verify a review (Admin only)
 */
export const verifyReview = async (reviewId: number): Promise<ReviewDTO> => {
  try {
    const response = await api.put<ReviewResponse>(`/admin/reviews/${reviewId}/verify`);
    return response.data.data as ReviewDTO;
  } catch (error: any) {
    console.error('Error verifying review:', error);
    throw new Error(error.response?.data?.message || 'Failed to verify review');
  }
};

/**
 * Activate/Deactivate a review (Admin only)
 */
export const toggleReviewStatus = async (reviewId: number, activate: boolean): Promise<ReviewDTO> => {
  try {
    const endpoint = activate ? 'activate' : 'deactivate';
    const response = await api.put<ReviewResponse>(`/admin/reviews/${reviewId}/${endpoint}`);
    return response.data.data as ReviewDTO;
  } catch (error: any) {
    console.error(`Error ${activate ? 'activating' : 'deactivating'} review:`, error);
    throw new Error(error.response?.data?.message || `Failed to ${activate ? 'activate' : 'deactivate'} review`);
  }
};

/**
 * Get unverified reviews (Admin only)
 */
export const getUnverifiedReviews = async (page = 0, size = 20): Promise<{ reviews: ReviewDTO[]; pagination: PaginationInfo }> => {
  try {
    const response = await api.get<ReviewResponse>(`/admin/reviews/unverified?page=${page}&size=${size}`);
    
    return {
      reviews: response.data.data as ReviewDTO[],
      pagination: response.data.pagination!
    };
  } catch (error: any) {
    console.error('Error fetching unverified reviews:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch unverified reviews');
  }
};

/**
 * Get recent reviews (Admin only)
 */
export const getRecentReviews = async (limit = 10): Promise<ReviewDTO[]> => {
  try {
    const response = await api.get<ReviewResponse>(`/admin/reviews/recent?limit=${limit}`);
    return response.data.data as ReviewDTO[];
  } catch (error: any) {
    console.error('Error fetching recent reviews:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch recent reviews');
  }
};

/**
 * Search reviews by keyword (Admin only)
 */
export const searchReviews = async (keyword: string): Promise<ReviewDTO[]> => {
  try {
    const response = await api.get<ReviewResponse>(`/admin/reviews/search?keyword=${encodeURIComponent(keyword)}`);
    return response.data.data as ReviewDTO[];
  } catch (error: any) {
    console.error('Error searching reviews:', error);
    throw new Error(error.response?.data?.message || 'Failed to search reviews');
  }
};

/**
 * Bulk operations (Admin only)
 */
export const bulkVerifyReviews = async (reviewIds: number[]): Promise<void> => {
  try {
    await api.put<ReviewResponse>('/admin/reviews/bulk-verify', { reviewIds });
  } catch (error: any) {
    console.error('Error bulk verifying reviews:', error);
    throw new Error(error.response?.data?.message || 'Failed to bulk verify reviews');
  }
};

export const bulkDeleteReviews = async (reviewIds: number[]): Promise<void> => {
  try {
    await api.delete<ReviewResponse>('/admin/reviews/bulk-delete', { data: { reviewIds } });
  } catch (error: any) {
    console.error('Error bulk deleting reviews:', error);
    throw new Error(error.response?.data?.message || 'Failed to bulk delete reviews');
  }
};

/**
 * Update all dish rating statistics (Admin only)
 */
export const updateAllDishStats = async (): Promise<void> => {
  try {
    await api.post<ReviewResponse>('/admin/reviews/update-stats');
  } catch (error: any) {
    console.error('Error updating dish stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to update dish statistics');
  }
};