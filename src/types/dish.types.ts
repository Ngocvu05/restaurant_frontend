export interface Dish {
  id: number;
  dishId?: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  imageUrls?: string[];
  isAvailable: boolean;
  averageRating: number;
  totalReviews?: number;
  orderCount?: number;
}

export interface DishFilters {
  category: string | null;
  priceRange: 'all' | 'under50k' | '50k-100k' | '100k-200k' | 'over200k';
  sortBy: 'name' | 'price' | 'category' | 'averageRating' | 'orderCount';
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
  minRating?: number;
  availableOnly: boolean;
}

export interface ViewOptions {
  layout: 'grid' | 'list';
  itemsPerPage: number;
}
