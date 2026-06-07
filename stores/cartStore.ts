import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId:    number;
  productDetId: number;   // tb_product_det.id
  name:         string;
  price:        number;
  imageUrl:     string;
  quantity:     number;
  size?:        string;
  color?:       string;
}

interface CartStore {
  items: CartItem[];
  addItem:        (item: CartItem) => void;
  removeItem:     (productDetId: number) => void;
  updateQuantity: (productDetId: number, quantity: number) => void;
  clearCart:      () => void;
  totalCount:     () => number;
  totalPrice:     () => number;
  isInCart:       (productDetId: number) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      // productDetId 기준으로 중복 체크 → 있으면 수량 합산
      addItem: (item) =>
        set((s) => {
          const exists = s.items.find((i) => i.productDetId === item.productDetId);
          if (exists) {
            return {
              items: s.items.map((i) =>
                i.productDetId === item.productDetId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...s.items, item] };
        }),

      // productDetId 기준 삭제
      removeItem: (productDetId) =>
        set((s) => ({
          items: s.items.filter((i) => i.productDetId !== productDetId),
        })),

      // productDetId 기준 수량 수정
      updateQuantity: (productDetId, quantity) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productDetId === productDetId
              ? { ...i, quantity: Math.max(1, quantity) }
              : i,
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      // 이미 담겼는지 확인
      isInCart: (productDetId) =>
        get().items.some((i) => i.productDetId === productDetId),
    }),
    { name: 'gg-cart' },
  ),
);
