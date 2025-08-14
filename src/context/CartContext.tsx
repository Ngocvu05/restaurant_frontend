import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  getCart, 
  addToCart as apiAddToCart, 
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
  CartItemDTO 
} from '../api/cartApi';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  loadCartFromApi: (userId: number) => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  // Convert API response to CartItem format
  const convertApiToCartItem = useCallback((item: CartItemDTO): CartItem => ({
    id: item.dishId,
    name: item.dishName || 'Không rõ',
    price: item.unitPrice || 0,
    image: item.imageUrl || '',
    quantity: item.quantity,
  }), []);

  // Load cart from backend API with debounce protection
  const loadCartFromApi = useCallback(async (userId: number) => {
    if (loadingRef.current) return; // Prevent multiple calls
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      const response = await getCart(userId);
      const apiCart = response.items || [];
      const converted = apiCart.map(convertApiToCartItem);
      setCart(converted);
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng từ API:', error);
      // Fallback to localStorage if API fails
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch (parseError) {
          console.error('Lỗi khi parse localStorage cart:', parseError);
          setCart([]);
        }
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [convertApiToCartItem]);

  // Initialize cart on component mount - only run once
  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (userId && !isNaN(Number(userId))) {
      loadCartFromApi(Number(userId));
    } else {
      // Load from localStorage if not logged in
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch (error) {
          console.error('Lỗi khi parse localStorage cart:', error);
          setCart([]);
        }
      }
    }
  }, [loadCartFromApi]); // Empty dependency array - run only once

  // Save cart to localStorage for non-logged users
  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId && cart.length >= 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Add item to cart
  const addToCart = useCallback(async (item: Omit<CartItem, 'quantity'>) => {
    const userId = sessionStorage.getItem('userId');
    
    if (userId && !isNaN(Number(userId))) {
      // User is logged in - use API
      try {
        setIsLoading(true);
        
        // Check if item already exists in cart
        const existing = cart.find(i => i.id === item.id);
        const quantity = existing ? existing.quantity + 1 : 1;
        
        if (existing) {
          // Update existing item
          await apiUpdateCartItem({
            userId: Number(userId),
            dishId: item.id,
            quantity: quantity
          });
        } else {
          // Add new item
          await apiAddToCart({
            userId: Number(userId),
            dishId: item.id,
            quantity: 1
          });
        }
        
        // Update local state immediately for better UX
        setCart(prevCart => {
          const existingItem = prevCart.find(i => i.id === item.id);
          if (existingItem) {
            return prevCart.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            );
          }
          return [...prevCart, { ...item, quantity: 1 }];
        });
        
      } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        // Still update local state as fallback
        setCart(prevCart => {
          const existing = prevCart.find(i => i.id === item.id);
          if (existing) {
            return prevCart.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            );
          }
          return [...prevCart, { ...item, quantity: 1 }];
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // User not logged in - use local state
      setCart(prevCart => {
        const existing = prevCart.find(i => i.id === item.id);
        if (existing) {
          return prevCart.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prevCart, { ...item, quantity: 1 }];
      });
    }
  }, [cart]);

  // Remove item from cart
  const removeFromCart = useCallback(async (id: number) => {
    const userId = sessionStorage.getItem('userId');
    
    // Update UI immediately
    setCart(prevCart => prevCart.filter(item => item.id !== id));
    
    if (userId && !isNaN(Number(userId))) {
      // User is logged in - sync with API
      try {
        setIsLoading(true);
        await apiRemoveFromCart(Number(userId), id);
      } catch (error) {
        console.error('Lỗi khi xóa khỏi giỏ hàng:', error);
        // The UI is already updated, just log the error
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Update quantity
  const updateQuantity = useCallback(async (id: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(id);
      return;
    }

    const userId = sessionStorage.getItem('userId');
    
    // Update UI immediately
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
    
    if (userId && !isNaN(Number(userId))) {
      // User is logged in - sync with API
      try {
        setIsLoading(true);
        await apiUpdateCartItem({
          userId: Number(userId),
          dishId: id,
          quantity: quantity
        });
      } catch (error) {
        console.error('Lỗi khi cập nhật số lượng:', error);
        // The UI is already updated, just log the error
      } finally {
        setIsLoading(false);
      }
    }
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    const userId = sessionStorage.getItem('userId');
    
    // Clear UI immediately
    setCart([]);
    
    if (userId && !isNaN(Number(userId))) {
      // User is logged in - sync with API
      try {
        setIsLoading(true);
        await apiClearCart(Number(userId));
      } catch (error) {
        console.error('Lỗi khi xóa giỏ hàng:', error);
        // The UI is already updated, just log the error
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const contextValue = React.useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    setCart,
    loadCartFromApi,
    isLoading,
  }), [
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    loadCartFromApi,
    isLoading,
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};