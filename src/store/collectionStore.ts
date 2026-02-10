import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CoinRecord } from '../types/coin';

type CollectionState = {
  coins: CoinRecord[];
  addCoin: (coin: CoinRecord) => void;
};

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set) => ({
      coins: [],
      addCoin: (coin) =>
        set((state) => ({
          coins: [coin, ...state.coins],
        })),
    }),
    {
      name: 'scan-coin-collection',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
