import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  image: string | undefined;
}

interface RecentlyViewedState {
  items: RecentProduct[];
  addProduct: (product: RecentProduct) => void;
  clearItems: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],

      addProduct: (product) =>
        set((state) => ({
          items: [product, ...state.items.filter((i) => i.id !== product.id)].slice(0, 8),
        })),

      clearItems: () => set({ items: [] }),
    }),
    { name: "timn-recent" }
  )
);
