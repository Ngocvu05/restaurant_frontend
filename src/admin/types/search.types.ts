export interface DishSearchResult {
  id: number;
  dishId?: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  imageUrls?: string[];
  isAvailable: boolean;
  averageRating: number;
}

export interface UserSearchResult {
  id: number;
  userId?: number;
  username: string;
  fullName: string;
  email: string;
  roleName: string;
  status: string;
  avatarUrl?: string;
}

export interface ReviewSearchResult {
  id: number;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  dishId: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export type SearchResult = DishSearchResult | UserSearchResult | ReviewSearchResult;
