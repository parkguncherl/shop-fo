import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '@/libs/api';

export type PaymentMethod = 'CARD' | 'NAVER_PAY' | 'KAKAO_PAY' | 'TOSS_PAY' | 'VIRTUAL_ACCOUNT' | 'BANK_TRANSFER';

export interface CheckoutOrderItem {
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
      paymentNo: string;
      payType: 'POINT' | 'PG';
      payMethod: 'POINT' | PaymentMethod;
      amount: number;
      pgProvider?: 'PORTONE';
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
  return useMutation({
    mutationFn: async (payload: CreateCheckoutPayload) => {
      const { data: orderData } = await authApi.post('/frontWeb/order', payload);
      const orderId = orderData?.body?.orderId ?? orderData?.body?.id;

      const { data: paymentData } = await authApi.post('/frontWeb/payment', {
        orderId,
        orderNo: payload.orderNo,
        paymentId: payload.payment.paymentId,
        totalAmount: payload.payment.totalAmount,
        currency: payload.payment.currency,
        details: payload.payment.details,
      });

      return { order: orderData?.body, payment: paymentData?.body };
    },
  });
};