// src/hooks/useReviews.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  getDishReviews, 
  getDishReviewStats, 
  createReview,
  ReviewDTO, 
  ReviewStats,
  PaginationInfo 
} from '../api/reviewApi';

export interface UseReviewsOptions {
  dishId: number;
  pageSize?: number;
  autoFetch?: boolean;
}

export interface ReviewFilters {
  rating?: number;
  verified?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface UseReviewsReturn {
  // Data
  reviews: ReviewDTO[];
  reviewStats: ReviewStats | null;
  pagination: PaginationInfo | null;
  
  // Loading states
  loading: boolean;
  submitting: boolean;
  
  // Current state
  currentPage: number;
  filters: ReviewFilters;
  
  // Actions
  fetchReviews: () => Promise<void>;
  fetchStats: () => Promise<void>;
  submitReview: (reviewData: Partial<ReviewDTO>) => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: Partial<ReviewFilters>) => void;
  refresh: () => Promise<void>;
}

export const useReviews = ({ 
  dishId, 
  pageSize = 5, 
  autoFetch = true 
}: UseReviewsOptions): UseReviewsReturn => {
  
  // State
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFiltersState] = useState<ReviewFilters>({
    sortBy: 'createdAt',
    sortDir: 'desc'
  });

  // Fetch reviews with current filters and pagination
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { reviews: reviewsData, pagination: paginationData } = await getDishReviews(
        dishId,
        {
          page: currentPage,
          size: pageSize,
          ...filters
        }
      );
      
      setReviews(reviewsData);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [dishId, currentPage, pageSize, filters]);

  // Fetch review statistics
  const fetchStats = useCallback(async () => {
    try {
      const stats = await getDishReviewStats(dishId);
      setReviewStats(stats);
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }, [dishId]);

  // Submit new review
  const submitReview = useCallback(async (reviewData: Partial<ReviewDTO>) => {
    try {
      setSubmitting(true);
      await createReview(dishId, reviewData);
      
      // Refresh data after successful submission
      await Promise.all([fetchReviews(), fetchStats()]);
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [dishId, fetchReviews, fetchStats]);

  // Set current page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<ReviewFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(0); // Reset to first page when filters change
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchReviews(), fetchStats()]);
  }, [fetchReviews, fetchStats]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchReviews();
    }
  }, [fetchReviews, autoFetch]);

  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [fetchStats, autoFetch]);

  return {
    // Data
    reviews,
    reviewStats,
    pagination,
    
    // Loading states
    loading,
    submitting,
    
    // Current state
    currentPage,
    filters,
    
    // Actions
    fetchReviews,
    fetchStats,
    submitReview,
    setPage,
    setFilters,
    refresh
  };
};