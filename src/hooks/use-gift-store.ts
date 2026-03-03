import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GiftStore {
  balance: number;
  cartItems: any[];
  updateBalance: (newBalance: number) => void;
  addToCart: (item: any) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
}

export const useGiftStore = create<GiftStore>()(
  persist(
    (set) => ({
      balance: 2500,
      cartItems: [],
      updateBalance: (newBalance) => set({ balance: newBalance }),
      addToCart: (item) => set((state) => ({ 
        cartItems: [...state.cartItems, item] 
      })),
      removeFromCart: (itemId) => set((state) => ({ 
        cartItems: state.cartItems.filter(item => item.id !== itemId) 
      })),
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'gift-store',
    }
  )
);