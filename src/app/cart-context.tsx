import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from './types';

interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  updateItemSize: (productId: string, previousSize: string | undefined, nextSize: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('dark-ranch-cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('dark-ranch-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1, size?: string, color?: string) => {
    setCart(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.id === product.id && item.selectedSize === size
      );

      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }

      return [...prev, { ...product, quantity, selectedSize: size, selectedColor: color }];
    });
  };

  const removeFromCart = (productId: string, size?: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.selectedSize === size)));
  };

  const updateQuantity = (productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart(prev => prev.map(item => 
      (item.id === productId && item.selectedSize === size) 
        ? { ...item, quantity } 
        : item
    ));
  };

  const updateItemSize = (productId: string, previousSize: string | undefined, nextSize: string) => {
    setCart((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === productId && item.selectedSize === previousSize);
      if (sourceIndex === -1) return prev;

      const duplicateIndex = prev.findIndex((item, index) => (
        index !== sourceIndex && item.id === productId && item.selectedSize === nextSize
      ));

      if (duplicateIndex > -1) {
        const merged = [...prev];
        merged[duplicateIndex] = {
          ...merged[duplicateIndex],
          quantity: merged[duplicateIndex].quantity + merged[sourceIndex].quantity,
        };
        merged.splice(sourceIndex, 1);
        return merged;
      }

      return prev.map((item, index) => (
        index === sourceIndex
          ? { ...item, selectedSize: nextSize }
          : item
      ));
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + ((item.salePrice ?? item.price) * item.quantity), 0);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, updateItemSize, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
