import PortOne from '@portone/browser-sdk/v2';
import type { PaymentMethod } from '@/hooks/useCheckout';

interface RequestPortOnePaymentParams {
  paymentId: string;
  orderName: string;
  totalAmount: number;
  method: PaymentMethod;
  customer: {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
  };
  customData?: Record<string, unknown>;
}

const getPortOneConfig = () => {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID?.trim();
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY?.trim();

  if (!storeId) {
    throw new Error('포트원 Store ID가 설정되지 않았습니다. NEXT_PUBLIC_PORTONE_STORE_ID를 확인해주세요.');
  }
  if (!channelKey) {
    throw new Error('포트원 이니시스 채널 키가 설정되지 않았습니다. NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY를 확인해주세요.');
  }

  return { storeId, channelKey };
};

const getPortOneMethodPayload = (method: PaymentMethod) => {
  switch (method) {
    case 'CARD':
      return { payMethod: 'CARD', card: {} } as const;
    case 'VIRTUAL_ACCOUNT':
      return { payMethod: 'VIRTUAL_ACCOUNT', virtualAccount: {} } as const;
    case 'BANK_TRANSFER':
      return { payMethod: 'TRANSFER', transfer: {} } as const;
    default:
      throw new Error('현재 이니시스 테스트 채널은 카드, 가상계좌, 계좌이체 결제만 연결되어 있습니다.');
  }
};

export const requestPortOnePayment = async ({ paymentId, orderName, totalAmount, method, customer, customData }: RequestPortOnePaymentParams) => {
  const { storeId, channelKey } = getPortOneConfig();
  const { payMethod, ...paymentMethodOptions } = getPortOneMethodPayload(method);

  const response = await PortOne.requestPayment({
    storeId,
    channelKey,
    paymentId,
    orderName,
    totalAmount,
    currency: 'KRW',
    payMethod,
    customer: {
      customerId: customer.id,
      fullName: customer.name,
      phoneNumber: customer.phoneNumber,
      email: customer.email,
    },
    customData,
    redirectUrl: typeof window === 'undefined' ? undefined : `${window.location.origin}/checkout`,
    ...paymentMethodOptions,
  } as Parameters<typeof PortOne.requestPayment>[0]);

  if (!response) {
    throw new Error('포트원 결제 응답이 없습니다.');
  }

  if (response.code) {
    throw new Error(response.message || '포트원 결제가 실패했습니다.');
  }

  return response;
};
