import React, { createContext, useContext, useState, useCallback } from 'react';
import { cartService } from '../services/orderService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user || user.role !== 'buyer') return;
    setLoading(true);
    try {
      const res = await cartService.get();
      setCart(res.data.cart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToCart = async (productId, quantity = 1, isWholesale = false) => {
    const res = await cartService.add({ productId, quantity, isWholesale });
    setCart(res.data.cart);
  };

  const updateItem = async (itemId, quantity) => {
    const res = await cartService.update(itemId, quantity);
    setCart(res.data.cart);
  };

  const removeItem = async (itemId) => {
    const res = await cartService.remove(itemId);
    setCart(res.data.cart);
  };

  const clearCart = async () => {
    const res = await cartService.clear();
    setCart(res.data.cart);
  };

  const itemCount = (cart.items || []).reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loading, refreshCart, addToCart, updateItem, removeItem, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
