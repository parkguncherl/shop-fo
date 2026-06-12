'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import OrderSummary from '@/components/checkout/OrderSummary/OrderSummary';
import PaymentForm from '@/components/checkout/PaymentForm/PaymentForm';
import Button from '@/components/common/Button/Button';
import { toastError, toastSuccess } from '@/components/common/Others/ToastMessage';
import { useCartQuery } from '@/hooks/useCart';
import { PaymentMethod, useCreateCheckoutMutation, usePointBalanceQuery } from '@/hooks/useCheckout';
import styles from './CheckoutPage.module.scss';

const FREE_SHIPPING_THRESHOLD = 50000;

const makeOrderNo = () => `ORD-${Date.now()}`;
const makePaymentId = () => `PAY-${Date.now()}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: cart, isLoading } = useCartQuery();
  const socialAccountId = session?.socialAccountId;
  const { data: pointBalance = 0 } = usePointBalanceQuery(socialAccountId);
  const createCheckout = useCreateCheckoutMutation();

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [memo, setMemo] = useState('');
  const [usedPoint, setUsedPoint] = useState(0);

  const items = cart?.items ?? [];
  const productAmount = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);
  const shippingFee = productAmount > 0 && productAmount < FREE_SHIPPING_THRESHOLD ? 3000 : 0;
  const orderAmount = productAmount + shippingFee;
  const cappedUsedPoint = Math.min(usedPoint, pointBalance, orderAmount);
  const paymentAmount = Math.max(orderAmount - cappedUsedPoint, 0);
  const earnedPoint = Math.floor(paymentAmount * 0.02);

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
    if (!receiverName || !receiverPhone || !zipCode || !address || !addressDetail) {
      toastError('배송지 정보를 모두 입력해주세요.');
      return false;
    }
    return true;
  };

  const handlePay = async (method: PaymentMethod) => {
    if (!validate()) return;

    const orderNo = makeOrderNo();
    const paymentId = makePaymentId();
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
      });
    }

    try {
      await createCheckout.mutateAsync({
        orderNo,
        socialAccountId: socialAccountId!,
        productAmount: orderAmount,
        discountAmount: 0,
        usedPoint: cappedUsedPoint,
        paymentAmount,
        earnedPoint,
        receiverName,
        receiverPhone,
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
      toastError('주문 생성 중 오류가 발생했습니다. 결제 API 연결 상태를 확인해주세요.');
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
                <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="010-0000-0000" />
              </label>
              <label>
                <span>우편번호</span>
                <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="우편번호" />
              </label>
              <label className={styles.fullLine}>
                <span>주소</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="기본 주소" />
              </label>
              <label className={styles.fullLine}>
                <span>상세 주소</span>
                <input value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="상세 주소" />
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