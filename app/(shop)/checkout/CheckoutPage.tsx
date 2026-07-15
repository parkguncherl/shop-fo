'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { type Address } from 'react-daum-postcode';
import OrderSummary from '@/components/checkout/OrderSummary/OrderSummary';
import AddressSearchModal from '@/components/checkout/AddressSearchModal/AddressSearchModal';
import PaymentForm from '@/components/checkout/PaymentForm/PaymentForm';
import DeliveryAddressSelector from '@/components/checkout/DeliveryAddressSelector/DeliveryAddressSelector';
import Button from '@/components/common/Button/Button';
import { toastError, toastSuccess } from '@/components/common/Others/ToastMessage';
import { useCartQuery } from '@/hooks/useCart';
import { PaymentMethod, useCreateCheckoutMutation, usePointBalanceQuery } from '@/hooks/useCheckout';
import { DeliveryAddress, useDeliveryAddressListQuery, useSaveDeliveryAddressMutation } from '@/hooks/useDeliveryAddress';
import { requestPortOnePayment } from '@/libs/portone';
import styles from './CheckoutPage.module.scss';
import { usePageViewLog } from '@/hooks/usePageViewLog';

const FREE_SHIPPING_THRESHOLD = 50000;
const makeOrderNo = () => `ORD-${Date.now()}`;
const makePaymentId = () => `PAY-${Date.now()}`;
const PENDING_ORDER_KEY = 'pending_checkout_data';

export default function CheckoutPage() {
  usePageViewLog({ pageType: 'Checkout' });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { data: cart, isLoading } = useCartQuery();
  const socialAccountId = session?.socialAccountId;
  const defaultBuyerEmail = session?.email || session?.user?.email || '';
  const { data: pointBalance = 0 } = usePointBalanceQuery(socialAccountId);
  const createCheckout = useCreateCheckoutMutation();
  const saveAddress = useSaveDeliveryAddressMutation();
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const addressDetailRef = useRef<HTMLInputElement>(null);

  const { data: savedAddresses = [] } = useDeliveryAddressListQuery(socialAccountId);

  // 배송지 폼 상태
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [memo, setMemo] = useState('');
  const [usedPoint, setUsedPoint] = useState(0);

  // 배송지 저장 옵션
  const [saveAddressChecked, setSaveAddressChecked] = useState(false);
  const [addressAlias, setAddressAlias] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);

  // 저장된 배송지가 없으면 저장 + 기본 배송지 + 별칭 자동 설정
  useEffect(() => {
    if (savedAddresses.length === 0) {
      setSaveAddressChecked(true);
      setSetAsDefault(true);
      setAddressAlias('집');
    }
  }, [savedAddresses]);

  // 수정 모드
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);

  useEffect(() => {
    if (defaultBuyerEmail && !buyerEmail) setBuyerEmail(defaultBuyerEmail);
  }, [defaultBuyerEmail, buyerEmail]);

  // PortOne 리다이렉트 복귀 처리
  useEffect(() => {
    const returnedPaymentId = searchParams.get('paymentId');
    const returnedTxId = searchParams.get('txId');
    const transactionType = searchParams.get('transactionType');

    if (!returnedPaymentId || !returnedTxId || transactionType !== 'PAYMENT') return;

    const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) {
      toastError('주문 데이터를 찾을 수 없습니다. 다시 시도해주세요.');
      return;
    }

    const pending = JSON.parse(raw);
    sessionStorage.removeItem(PENDING_ORDER_KEY);

    (async () => {
      try {
        const details = [];
        if (pending.cappedUsedPoint > 0) {
          details.push({ payType: 'POINT' as const, payMethod: 'POINT' as const, amount: pending.cappedUsedPoint });
        }
        if (pending.paymentAmount > 0) {
          details.push({
            payType: 'PG' as const,
            payMethod: pending.method,
            amount: pending.paymentAmount,
            pgProvider: 'PORTONE' as const,
            pgTid: returnedTxId,
            portonePaymentId: returnedPaymentId,
          });
        }

        await createCheckout.mutateAsync({
          ...pending.payload,
          payment: { paymentId: returnedPaymentId, totalAmount: pending.orderAmount, currency: 'KRW', details },
        });

        if (pending.saveAddressChecked && pending.addressAlias) {
          await saveAddress.mutateAsync({ ...pending.addressPayload });
        }

        toastSuccess('주문이 완료되었습니다.');
        router.push('/mypage/orders');
      } catch (error) {
        toastError(error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다.');
      }
    })();
  }, [searchParams]);

  const fillFormFromAddress = useCallback((addr: DeliveryAddress) => {
    setReceiverName(addr.receiverName);
    setReceiverPhone(addr.receiverPhone);
    setZipCode(addr.zipCode);
    setAddress(addr.address);
    setAddressDetail(addr.addressDetail ?? '');
    setMemo(addr.memo ?? '');
  }, []);

  // 저장된 배송지 중 기본 배송지를 최초 자동 선택
  useEffect(() => {
    if (savedAddresses.length > 0 && !receiverName) {
      const defaultAddr = savedAddresses.find((a) => a.isDefault === 'Y') ?? savedAddresses[0];
      fillFormFromAddress(defaultAddr);
    }
  }, [savedAddresses, fillFormFromAddress]);

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

  const handleAddressComplete = (data: Address) => {
    const selectedAddress = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
    setZipCode(data.zonecode);
    setAddress(selectedAddress || data.address);
    window.setTimeout(() => addressDetailRef.current?.focus(), 0);
  };

  const summaryItems = items.map((item) => ({
    id: item.cartId,
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
      router.push('/login?callbackUrl=/checkout');
      return false;
    }
    if (items.length === 0) {
      toastError('주문할 상품이 없습니다.');
      router.push('/cart');
      return false;
    }
    if (!receiverName.trim()) {
      toastError('받는 분 이름을 입력해주세요.');
      return false;
    }
    if (!receiverPhone.trim()) {
      toastError('연락처를 입력해주세요.');
      return false;
    }
    if (!buyerEmail.trim()) {
      toastError('이메일을 입력해주세요.');
      return false;
    }
    if (!zipCode || !address) {
      toastError('주소 검색으로 배송지 주소를 입력해주세요.');
      return false;
    }
    if (!addressDetail.trim()) {
      toastError('상세 주소를 입력해주세요.');
      return false;
    }
    if (saveAddressChecked && !addressAlias.trim()) {
      toastError('저장할 배송지 별칭을 입력해주세요.');
      return false;
    }
    return true;
  };

  const handlePay = async (method: PaymentMethod) => {
    if (!validate()) return;

    const orderNo = makeOrderNo();
    const paymentId = makePaymentId();
    const orderName = items.length > 1 ? `${items[0].productName} 외 ${items.length - 1}건` : items[0]?.productName ?? '맵시꾼 주문';

    try {
      // 리다이렉트 방식 결제 대비 주문 데이터 sessionStorage에 미리 저장
      const pendingPayload = {
        orderNo,
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
          cartId: item.cartId,
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
      };
      sessionStorage.setItem(
        PENDING_ORDER_KEY,
        JSON.stringify({
          payload: pendingPayload,
          orderAmount,
          cappedUsedPoint,
          paymentAmount,
          method,
          saveAddressChecked,
          addressAlias: addressAlias.trim(),
          addressPayload: saveAddressChecked
            ? {
                socialAccountId: socialAccountId!,
                alias: addressAlias.trim(),
                receiverName,
                receiverPhone,
                zipCode,
                address,
                addressDetail,
                memo,
                isDefault: setAsDefault ? ('Y' as const) : ('N' as const),
              }
            : null,
        }),
      );

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
          customData: { orderNo, socialAccountId, usedPoint: cappedUsedPoint },
        });
      }

      const details = [];
      if (cappedUsedPoint > 0) {
        details.push({ payType: 'POINT' as const, payMethod: 'POINT' as const, amount: cappedUsedPoint });
      }
      if (paymentAmount > 0) {
        details.push({
          payType: 'PG' as const,
          payMethod: method,
          amount: paymentAmount,
          pgProvider: 'PORTONE' as const,
          pgTid: portOneResponse?.txId,
          portonePaymentId: portOneResponse?.paymentId,
          rawResponse: portOneResponse ? JSON.stringify(portOneResponse) : undefined,
        });
      }

      // 팝업 방식 성공 시 sessionStorage 정리 후 주문 생성
      sessionStorage.removeItem(PENDING_ORDER_KEY);

      await createCheckout.mutateAsync({ ...pendingPayload, payment: { paymentId, totalAmount: orderAmount, currency: 'KRW', details } });

      if (saveAddressChecked && addressAlias.trim()) {
        await saveAddress.mutateAsync({
          socialAccountId: socialAccountId!,
          alias: addressAlias.trim(),
          receiverName,
          receiverPhone,
          zipCode,
          address,
          addressDetail,
          memo,
          isDefault: setAsDefault ? 'Y' : 'N',
        });
      }

      toastSuccess('주문이 완료되었습니다.');
      router.push('/mypage/orders');
    } catch (error) {
      toastError(error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.');
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className={styles.page}>주문서를 불러오는 중입니다.</div>;
  }

  return (
    <>
      <AddressSearchModal open={addressModalOpen} onClose={() => setAddressModalOpen(false)} onComplete={handleAddressComplete} />
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>주문/결제</h1>
          <p>카카오 로그인 회원만 주문할 수 있습니다.</p>
        </header>

        <div className={styles.layout}>
          <section className={styles.left}>
            <section className={styles.panel}>
              <h2>배송지 정보</h2>

              {/* 저장된 배송지 선택 */}
              {savedAddresses.length > 0 && (
                <DeliveryAddressSelector
                  addresses={savedAddresses}
                  socialAccountId={socialAccountId!}
                  onSelect={fillFormFromAddress}
                  onEdit={(addr) => setEditingAddress(addr)}
                />
              )}

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
                  <button type="button" className={styles.addressSearchBtn} onClick={() => setAddressModalOpen(true)}>
                    주소검색
                  </button>
                </div>
                <label className={styles.fullLine}>
                  <span>주소</span>
                  <input value={address} readOnly placeholder="주소검색을 눌러 기본주소를 입력해주세요" />
                </label>
                <label className={styles.fullLine}>
                  <span>상세주소</span>
                  <input
                    ref={addressDetailRef}
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="상세주소를 입력해주세요"
                  />
                </label>
                <label className={styles.fullLine}>
                  <span>배송 메모</span>
                  <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="배송 요청사항" />
                </label>
              </div>

              {/* 배송지 저장 옵션 */}
              <div className={styles.saveAddressWrap}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={saveAddressChecked} onChange={(e) => setSaveAddressChecked(e.target.checked)} />
                  <span>이 배송지를 저장하기</span>
                </label>
                {saveAddressChecked && (
                  <div className={styles.saveAddressOptions}>
                    <input
                      className={styles.aliasInput}
                      value={addressAlias}
                      onChange={(e) => setAddressAlias(e.target.value)}
                      placeholder="별칭 입력 (예: 집, 회사)"
                      maxLength={20}
                    />
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} />
                      <span>기본 배송지로 설정</span>
                    </label>
                  </div>
                )}
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
    </>
  );
}
