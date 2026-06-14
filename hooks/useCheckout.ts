import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/libs/api';
import { CART_QUERY_KEY } from '@/hooks/useCart';

export type PaymentMethod = 'CARD' | 'NAVER_PAY' | 'KAKAO_PAY' | 'TOSS_PAY' | 'VIRTUAL_ACCOUNT' | 'BANK_TRANSFER';

export interface CheckoutOrderItem {
  cartId: number;
  productId: number;
  productDetId: number;
  productName: string;
  productImage?: string | null;
  optionName?: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  paymentAmount: number;
}

export interface CreateCheckoutPayload {
  orderNo: string;
  socialAccountId: number;
  productAmount: number;
  discountAmount: number;
  usedPoint: number;
  paymentAmount: number;
  earnedPoint: number;
  receiverName: string;
  receiverPhone: string;
  buyerEmail: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  memo?: string;
  items: CheckoutOrderItem[];
  payment: {
    paymentId: string;
    totalAmount: number;
    currency: 'KRW';
    details: Array<{
      payType: 'POINT' | 'PG';
      payMethod: 'POINT' | PaymentMethod;
      amount: number;
      pgProvider?: 'PORTONE';
      pgTid?: string;
      portonePaymentId?: string;
      rawResponse?: string;
    }>;
  };
}

export const usePointBalanceQuery = (socialAccountId?: number) => {
  return useQuery<number>({
    queryKey: ['pointBalance', socialAccountId],
    enabled: Boolean(socialAccountId),
    queryFn: async () => {
      const { data } = await authApi.get('/frontWeb/point/balance', { params: { socialAccountId } });
      return data?.body?.pointBalance ?? data?.body ?? 0;
    },
  });
};

export const useCreateCheckoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCheckoutPayload) => {
      const { data } = await authApi.post('/frontWeb/checkout', {
        orderNo: payload.orderNo,
        socialAccountId: payload.socialAccountId,
        productAmount: payload.productAmount,
        discountAmount: payload.discountAmount,
        usedPoint: payload.usedPoint,
        paymentAmount: payload.paymentAmount,
        earnedPoint: payload.earnedPoint,
        receiverName: payload.receiverName,
        receiverPhone: payload.receiverPhone,
        zipCode: payload.zipCode,
        address: payload.address,
        addressDetail: payload.addressDetail,
        memo: payload.memo,
        items: payload.items,
        paymentId: payload.payment.paymentId,
        totalAmount: payload.payment.totalAmount,
        currency: payload.payment.currency,
        details: payload.payment.details,
      });

      return data?.body;
    },
    onSuccess: () => {
      // 주문 완료 후 장바구니 캐시 초기화
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
};
