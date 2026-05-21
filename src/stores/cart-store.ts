import { create } from "zustand";
import { persist } from "zustand/middleware";

export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_FEE = 35;

export const PROMO_CODES: Record<string, number> = {
  TIMN10: 10,
  INTEGRITY15: 15,
  WELCOME20: 20,
};

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  image?: string;
  quantity: number;
  variant?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  discountCode: string | null;
  discountPercent: number;

  // Actions
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyDiscount: (code: string) => boolean;
  removeDiscount: () => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
  discountAmount: () => number;
  shippingCost: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      discountCode: null,
      discountPercent: 0,

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.id === item.id && i.variant === item.variant
          );
          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += quantity;
            return { items: updated };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) { get().removeItem(id); return; }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [], discountCode: null, discountPercent: 0 }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      applyDiscount: (code) => {
        const upper = code.trim().toUpperCase();
        const percent = PROMO_CODES[upper];
        if (percent != null) {
          set({ discountCode: upper, discountPercent: percent });
          return true;
        }
        return false;
      },

      removeDiscount: () => set({ discountCode: null, discountPercent: 0 }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + (item.salePrice ?? item.price) * item.quantity, 0),

      discountAmount: () => {
        const sub = get().subtotal();
        return (sub * get().discountPercent) / 100;
      },

      shippingCost: () => {
        const afterDiscount = get().subtotal() - get().discountAmount();
        return afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      },

      total: () => get().subtotal() - get().discountAmount() + get().shippingCost(),
    }),
    {
      name: "timn-cart",
      partialize: (state) => ({
        items: state.items,
        discountCode: state.discountCode,
        discountPercent: state.discountPercent,
      }),
      // Coerce prices to numbers in case old localStorage entries stored them as strings (Prisma Decimal serialization)
      merge: (persisted, current) => {
        const p = persisted as Partial<CartState>;
        return {
          ...current,
          ...p,
          items: (p.items ?? []).map((item) => ({
            ...item,
            price: Number(item.price),
            salePrice: item.salePrice != null ? Number(item.salePrice) : undefined,
            quantity: Number(item.quantity),
          })),
          discountPercent: Number(p.discountPercent ?? 0),
        };
      },
    }
  )
);
