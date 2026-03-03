import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletStore {
  balance: number;
  transactions: any[];
  updateBalance: (newBalance: number) => void;
  addTransaction: (transaction: any) => void;
}

export const useWallet = create<WalletStore>()(
  persist(
    (set) => ({
      balance: 2500,
      transactions: [],
      updateBalance: (newBalance) => set({ balance: newBalance }),
      addTransaction: (transaction) => set((state) => ({ 
        transactions: [transaction, ...state.transactions] 
      })),
    }),
    {
      name: 'wallet-storage',
    }
  )
);