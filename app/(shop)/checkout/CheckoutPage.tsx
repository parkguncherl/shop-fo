'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDaumPostcodePopup, type Address } from 'react-daum-postcode';
import OrderSummary from '@/components/checkout/OrderSummary/OrderSummary';
import PaymentForm from '@/components/checkout/PaymentForm/PaymentForm';
import Button from '@/components/common/Button/Button';
import { toastError, toastSuccess } from '@/components/common/Others/ToastMessage';
import { useCartQuery } from '@/hooks/useCart';
import { PaymentMethod, useCreateCheckoutMutation, usePointBalanceQuery } from '@/hooks/useCheckout';
import { requestPortOnePayment } from '@/libs/portone';
import styles from './CheckoutPage.module.scss';

const FREE_SHIPPING_THRESHOLD = 50000;

const makeOrderNo = () => `ORD-${Date.now()}`;
const makePaymentId = () => `PAY-${Date.now()}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: cart, isLoading } = useCartQuery();
  const socialAccountId = session?.socialAccountId;
  const defaultBuyerEmail = session?.email || session?.user?.email || '';
  const { data: pointBalance = 0 } = usePointBalanceQuery(socialAccountId);
  const createCheckout = useCreateCheckoutMutation();
  const openPostcode = useDaumPostcodePopup();
  const addressDetailRef = useRef<HTMLInputElement>(null);

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [memo, setMemo] = useState('');
  const [usedPoint, setUsedPoint] = useState(0);

  useEffect(() => {
    if (defaultBuyerEmail && !buyerEmail) {
      setBuyerEmail(defaultBuyerEmail);
    }
  }, [defaultBuyerEmail, buyerEmail]);
  const items = cart?.items ?? [];
  const productAmount = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);
  const shippingFee = productAmount > 0 && productAmount < FREE_SHIPPING_THRESHOLD ? 3000 : 0;
  const orderAmount = productAmount + shippingFee;
  const cappedUsedPoint = Math.min(usedPoint, pointBalance, orderAmount);
  const paymentAmount = Math.max(orderAmount - cappedUsedPoint, 0);
  const earnedPoint = Math.floor(paymentAmount * 0.02);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handleReceiverPhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReceiverPhone(formatPhoneNumber(event.target.value));
  };
  const handleSearchAddress = async () => {
    await openPostcode({
      popupTitle: '주소 검색',
      autoClose: true,
      onComplete: (data: Address) => {
        const selectedAddress = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
        setZipCode(data.zonecode);
        setAddress(selectedAddress || data.address);
        window.setTimeout(() => addressDetailRef.current?.focus(), 0);
      },
      onError: () => toastError('주소 검색창을 열 수 없습니다. 잠시 후 다시 시도해주세요.'),
    });
  };
  const summaryItems = items.map((item) => ({
    id: item.cartItemId,
    name: item.productName,
    price: item.unitPrice,
    quantity: item.quantity,
    imageUrl: item.productImage,
    size: item.productDetSize,
    color: item.productDetColor,
  }));

  const validate = () => {
    if (status !== 'authenticated' || !socialAccountId) {
      toastError('카카오 로그인 후 주문할 수 있습니다.');
      router.push('/login');
      return false;
    }
    if (items.length === 0) {
      toastError('주문할 상품이 없습니다.');
      router.push('/cart');
      return false;
    }
    if (!receiverName || !receiverPhone || !buyerEmail || !zipCode || !address || !addressDetail) {
      toastError('배송지 정보를 모두 입력해주세요.');
      return false;
    }
    return true;
  };

  const handlePay = async (method: PaymentMethod) => {
    if (!validate()) return;

    const orderNo = makeOrderNo();
    const paymentId = makePaymentId();
    const orderName = items.length > 1 ? `${items[0].productName} 외 ${items.length - 1}건` : items[0]?.productName ?? 'GGUANGGU 주문';

    try {
      let portOneResponse: Awaited<ReturnType<typeof requestPortOnePayment>> | null = null;

      if (paymentAmount > 0) {
        portOneResponse = await requestPortOnePayment({
          paymentId,
          orderName,
          totalAmount: paymentAmount,
          method,
          customer: {
            id: String(socialAccountId),
            name: receiverName,
            phoneNumber: receiverPhone,
            email: buyerEmail.trim(),
          },
          customData: {
            orderNo,
            socialAccountId,
            cartId: cart?.cartId,
            usedPoint: cappedUsedPoint,
          },
        });
      }

      const details = [];

      if (cappedUsedPoint > 0) {
        details.push({
          paymentNo: `${paymentId}-POINT`,
          payType: 'POINT' as const,
          payMethod: 'POINT' as const,
          amount: cappedUsedPoint,
        });
      }

      if (paymentAmount > 0) {
        details.push({
          paymentNo: `${paymentId}-PG`,
          payType: 'PG' as const,
          payMethod: method,
          amount: paymentAmount,
          pgProvider: 'PORTONE' as const,
          pgTid: portOneResponse?.txId,
          portonePaymentId: portOneResponse?.paymentId,
          rawResponse: portOneResponse ? JSON.stringify(portOneResponse) : undefined,
        });
      }

      await createCheckout.mutateAsync({
        orderNo,
        cartId: cart?.cartId || undefined,
        socialAccountId: socialAccountId!,
        productAmount: orderAmount,
        discountAmount: 0,
        usedPoint: cappedUsedPoint,
        paymentAmount,
        earnedPoint,
        receiverName,
        receiverPhone,
        buyerEmail: buyerEmail.trim(),
        zipCode,
        address,
        addressDetail,
        memo,
        items: items.map((item) => ({
          productId: item.productId,
          productDetId: item.productDetId,
          productName: item.productName,
          productImage: item.productImage,
          optionName: [item.productDetColor, item.productDetSize].filter(Boolean).join(' / '),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: 0,
          paymentAmount: item.unitPrice * item.quantity,
        })),
        payment: {
          paymentId,
          totalAmount: orderAmount,
          currency: 'KRW',
          details,
        },
      });
      toastSuccess('주문 정보가 생성되었습니다.');
      router.push('/mypage/orders');
    } catch (error) {
      toastError(error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.');
    }
  };
  if (status === 'loading' || isLoading) {
    return <div className={styles.page}>주문서를 불러오는 중입니다.</div>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>주문/결제</h1>
        <p>카카오 로그인 회원만 주문할 수 있습니다.</p>
      </header>

      <div className={styles.layout}>
        <section className={styles.left}>
          <section className={styles.panel}>
            <h2>배송지 정보</h2>
            <div className={styles.formGrid}>
              <label>
                <span>수령인</span>
                <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="이름" />
              </label>
              <label>
                <span>연락처</span>
                <input value={receiverPhone} onChange={handleReceiverPhoneChange} inputMode="numeric" placeholder="010-0000-0000" />
              </label>
              <label>
                <span>이메일</span>
                <input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} inputMode="email" placeholder="email@example.com" />
              </label>
              <div className={styles.addressSearchField}>
                <label>
                  <span>우편번호</span>
                  <input value={zipCode} readOnly placeholder="우편번호" />
                </label>
                <button type="button" className={styles.addressSearchBtn} onClick={handleSearchAddress}>
                  주소검색
                </button>
              </div>
              <label className={styles.fullLine}>
                <span>주소</span>
                <input value={address} readOnly placeholder="주소검색을 눌러 기본주소를 입력해주세요" />
              </label>
              <label className={styles.fullLine}>
                <span>상세주소</span>
                <input ref={addressDetailRef} value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="상세주소를 입력해주세요" />
              </label>
              <label className={styles.fullLine}>
                <span>배송 메모</span>
                <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="배송 요청사항" />
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <PaymentForm
              productAmount={orderAmount}
              pointBalance={pointBalance}
              usedPoint={cappedUsedPoint}
              onUsedPointChange={setUsedPoint}
              onPay={handlePay}
              loading={createCheckout.isPending}
            />
          </section>
        </section>

        <aside className={styles.right}>
          <OrderSummary items={summaryItems} shippingFee={shippingFee} usedPoint={cappedUsedPoint} expectedPoint={earnedPoint} />
          <Button variant="outline" size="full" className={styles.backBtn} onClick={() => router.push('/cart')}>
            장바구니로 돌아가기
          </Button>
        </aside>
      </div>
    </main>
  );
}
