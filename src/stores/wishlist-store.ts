import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  clearWishlist: () => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],

      addItem: (id) =>
        set((state) => ({
          ids: state.ids.includes(id) ? state.ids : [...state.ids, id],
        })),

      removeItem: (id) =>
        set((state) => ({ ids: state.ids.filter((i) => i !== id) })),

      toggleItem: (id) => {
        const { ids } = get();
        set({ ids: ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id] });
      },

      isWishlisted: (id) => get().ids.includes(id),

      clearWishlist: () => set({ ids: [] }),

      count: () => get().ids.length,
    }),
    { name: "timn-wishlist" }
  )
);
