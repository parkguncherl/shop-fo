import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import publicApi from '@/libs/publicApi';
import { COOKIE_KEYS } from '@/libs/const';

// ── 쿠키에서 guestId 읽기 ─────────────────────────────────────
export const getGuestId = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_KEYS.GUEST_ID}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
};

// ── 타입 ──────────────────────────────────────────────────────
export interface CartItemInfo {
  cartItemId:      number;
  productDetId:    number;
  productId:       number;
  productName:     string;
  productImage:    string | null;
  productDetSize:  string | null;
  productDetColor: string | null;
  skuDiscountRate: number;
  quantity:        number;
  unitPrice:       number;
  subtotal:        number;
  optionsSnapshot: string | null;
}

export interface CartInfo {
  cartId:     number;
  items:      CartItemInfo[];
  totalCount: number;
  totalPrice: number;
}

export const CART_QUERY_KEY = ['cart'];

const emptyCart: CartInfo = { cartId: 0, items: [], totalCount: 0, totalPrice: 0 };

// ── 장바구니 조회 ─────────────────────────────────────────────
export const useCartQuery = () => {
  return useQuery<CartInfo>({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const guestId = getGuestId();
      if (!guestId) return emptyCart;
      const { data } = await publicApi.get('/frontWeb/cart', { params: { guestId } });
      return data?.body ?? emptyCart;
    },
    staleTime: 1000 * 30,
  });
};

// ── 상품 추가 ─────────────────────────────────────────────────
export const useAddCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      productDetId:     number;
      quantity:         number;
      unitPrice:        number;
      optionsSnapshot?: string;
    }) => {
      const guestId = getGuestId();
      const { data } = await publicApi.post('/frontWeb/cart/item', { guestId, ...params });
      return data?.body;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY }),
  });
};

// ── 수량 수정 ─────────────────────────────────────────────────
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { cartItemId: number; quantity: number }) => {
      const { data } = await publicApi.put('/frontWeb/cart/item', params);
      return data?.body;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY }),
  });
};

// ── 아이템 삭제 ───────────────────────────────────────────────
export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cartItemId: number) => {
      await publicApi.delete(`/frontWeb/cart/item/${cartItemId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY }),
  });
};

// ── 장바구니 비우기 ───────────────────────────────────────────
export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const guestId = getGuestId();
      await publicApi.delete('/frontWeb/cart/clear', { params: { guestId } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY }),
  });
};
