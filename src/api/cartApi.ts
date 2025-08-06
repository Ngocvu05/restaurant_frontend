import api from './axiosConfigUser';

export interface AddToCartRequest {
  userId: number;
  dishId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  userId: number;
  dishId: number;
  quantity: number;
}

export interface CartItemDTO {
  id?: number;
  userId: number;
  dishId: number;
  quantity: number;
  dishName?: string;
  unitPrice?: number;
  imageUrl?: string;
}

export interface CartDTO {
  userId: number;
  createdAt?: string;
  items: CartItemDTO[];
}

export interface CartSummaryDTO {
  userId: number;
  totalItems: number;
  totalAmount: number;
  deliveryFee: number;
  grandTotal: number;
}

const BASE_PATH = '/cart';

export const addToCart = async (request: AddToCartRequest): Promise<CartItemDTO> => {
  const res = await api.post(`${BASE_PATH}/add`, request);
  return res.data.data;
};

export const getCart = async (userId: number): Promise<CartDTO> => {
  const res = await api.get(`${BASE_PATH}/${userId}`);
  return res.data.data;
};

export const updateCartItem = async (request: UpdateCartItemRequest): Promise<CartItemDTO> => {
  const res = await api.put(`${BASE_PATH}/update`, request);
  return res.data.data;
};

export const removeFromCart = async (userId: number, dishId: number): Promise<void> => {
  await api.delete(`${BASE_PATH}/remove`, { params: { userId, dishId } });
};

export const clearCart = async (userId: number): Promise<void> => {
  await api.delete(`${BASE_PATH}/clear/${userId}`);
};

export const getCartSummary = async (userId: number): Promise<CartSummaryDTO> => {
  const res = await api.get(`${BASE_PATH}/summary/${userId}`);
  return res.data.data;
};

export const validateCart = async (userId: number): Promise<boolean> => {
  const res = await api.get(`${BASE_PATH}/validate/${userId}`);
  return res.data.data;
};
