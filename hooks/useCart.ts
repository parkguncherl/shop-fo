import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
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
  cartId:          number;   // TB_CART.id (구 cartItemId)
  productDetId:    number;
  productId:       number;
  creTm:           string | null;
  productName:     string;
  productImage:    string | null;
  productDetSize:  string | null;
  productDetColor: string | null;
  skuDiscountRate: number;
  quantity:        number;
  unitPrice:       number;
  subtotal:        number;
}

export interface CartInfo {
  items:      CartItemInfo[];
  totalCount: number;
  totalPrice: number;
}

export const CART_QUERY_KEY = ['cart'];

const emptyCart: CartInfo = { items: [], totalCount: 0, totalPrice: 0 };

// ── 장바구니 조회 ─────────────────────────────────────────────
export const useCartQuery = () => {
  const { data: session } = useSession();
  const socialAccountId = session?.socialAccountId;

  return useQuery<CartInfo>({
    queryKey: [...CART_QUERY_KEY, socialAccountId ?? 'guest'],
    queryFn: async () => {
      // 로그인 상태 → socialAccountId 로 회원 카트 조회
      if (socialAccountId) {
        const { data } = await publicApi.get('/frontWeb/cart', { params: { socialAccountId } });
        return data?.body ?? emptyCart;
      }
      // 비로그인 → guestId 로 게스트 카트 조회
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
  const { data: session } = useSession();
  return useMutation({
    mutationFn: async (params: {
      productDetId: number;
      quantity:     number;
    }) => {
      const guestId = getGuestId();
      const socialAccountId = session?.socialAccountId ?? null;
      const { data } = await publicApi.post('/frontWeb/cart/item', { guestId, socialAccountId, ...params });
      return data?.body;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY }),
  });
};

// ── 수량 수정 ─────────────────────────────────────────────────
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { cartId: number; quantity: number }) => {
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
    mutationFn: async (cartId: number) => {
      await publicApi.delete(`/frontWeb/cart/item/${cartId}`);
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
