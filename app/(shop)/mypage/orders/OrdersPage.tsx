'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/libs/api';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { toastError, toastSuccess } from '@/components/common/Others/ToastMessage';
import styles from './OrdersPage.module.scss';

interface OrderHistoryItem {
  orderItemId: number;
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

interface OrderHistoryDelivery {
  receiverName?: string | null;
  receiverPhone?: string | null;
  zipCode?: string | null;
  address?: string | null;
  addressDetail?: string | null;
  memo?: string | null;
  deliveryStatus?: string | null;
  deliveryStatusNm?: string | null;
  deliveryCompany?: string | null;
  invoiceNo?: string | null;
  shippedTm?: string | null;
  deliveredTm?: string | null;
}

interface OrderHistoryOrder {
  orderId: number;
  orderNo: string;
  cartId?: number | null;
  socialAccountId: number;
  orderStatus: string;
  productAmount: number;
  discountAmount: number;
  usedPoint: number;
  paymentAmount: number;
  earnedPoint: number;
  delivery?: OrderHistoryDelivery | null;
  creTm?: string | null;
  items?: OrderHistoryItem[];
}

interface PaymentHistoryItem {
  paymentSeq: number;
  orderId: number;
  orderNo: string;
  socialAccountId: number;
  orderStatus?: string | null;
  orderStatusNm?: string | null;
  paymentId: string;
  paymentStatus: string;
  paymentStatusNm?: string | null;
  totalAmount: number;
  usedPoint: number;
  paymentAmount: number;
  earnedPoint: number;
  currency: string;
  paidTm?: string | null;
  creTm?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  zipCode?: string | null;
  address?: string | null;
  addressDetail?: string | null;
  deliveryStatus?: string | null;
  deliveryStatusNm?: string | null;
  deliveryCompany?: string | null;
  invoiceNo?: string | null;
}

interface OrderHistoryRow extends OrderHistoryOrder {
  payment: PaymentHistoryItem;
}

const currency = new Intl.NumberFormat('ko-KR');
const EMPTY_ORDER_HISTORY: OrderHistoryRow[] = [];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

const formatWon = (value?: number | null) => `${currency.format(value ?? 0)}원`;

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const defaultToDate = () => toInputDate(new Date());
const defaultFromDate = () => toInputDate(addMonths(new Date(), -1));

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ').slice(0, 16);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getStatusTone = (status?: string | null) => {
  if (status === 'P' || status === 'READY' || status === 'SHIPPED' || status === 'DELIVERED') return styles.good;
  if (status === 'C') return styles.neutral;
  if (status === 'F') return styles.bad;
  return styles.waiting;
};

const canCancelPayment = (paymentStatus?: string | null, deliveryStatus?: string | null) =>
  paymentStatus === 'P' && (!deliveryStatus || deliveryStatus === 'READY');

const getRangeByMonths = (months: number) => {
  const to = new Date();
  const from = addMonths(to, -months);
  return { fromDate: toInputDate(from), toDate: toInputDate(to) };
};

const normalizeRange = (fromDate: string, toDate: string) => {
  let from = new Date(`${fromDate}T00:00:00`);
  let to = new Date(`${toDate}T00:00:00`);

  if (Number.isNaN(from.getTime())) from = addMonths(new Date(), -1);
  if (Number.isNaN(to.getTime())) to = new Date();
  if (from > to) from = addMonths(to, -1);

  const diffDays = Math.floor((to.getTime() - from.getTime()) / ONE_DAY_MS);
  if (diffDays > MAX_RANGE_DAYS) {
    from = new Date(to);
    from.setFullYear(from.getFullYear() - 1);
  }

  return { fromDate: toInputDate(from), toDate: toInputDate(to) };
};

const useOrderHistoryQuery = (socialAccountId?: number, fromDate?: string, toDate?: string) => {
  return useQuery<OrderHistoryRow[]>({
    queryKey: ['orderHistory', socialAccountId, fromDate, toDate],
    enabled: Boolean(socialAccountId && fromDate && toDate),
    queryFn: async () => {
      const [orderRes, paymentRes] = await Promise.all([
        authApi.get('/frontWeb/order/list', { params: { socialAccountId } }),
        authApi.get('/frontWeb/payment/list', { params: { socialAccountId, fromDate, toDate } }),
      ]);

      const orders = (orderRes.data?.body ?? []) as OrderHistoryOrder[];
      const payments = (paymentRes.data?.body ?? []) as PaymentHistoryItem[];
      const orderMap = new Map(orders.map((order) => [order.orderNo, order]));

      return payments
        .map((payment) => {
          const order = orderMap.get(payment.orderNo);
          if (!order) return null;
          return { ...order, payment };
        })
        .filter((row): row is OrderHistoryRow => row !== null)
        .sort((a, b) => new Date(b.payment.paidTm ?? b.payment.creTm ?? 0).getTime() - new Date(a.payment.paidTm ?? a.payment.creTm ?? 0).getTime());
    },
  });
};

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const socialAccountId = session?.socialAccountId;
  const [draftFromDate, setDraftFromDate] = useState(defaultFromDate);
  const [draftToDate, setDraftToDate] = useState(defaultToDate);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const queryClient = useQueryClient();
  const { data: orderData, isLoading, isError, refetch } = useOrderHistoryQuery(socialAccountId, fromDate, toDate);
  const orders = orderData ?? EMPTY_ORDER_HISTORY;
  const getFileUrl = useWebCommonStore((state) => state.getFileUrl);
  const [imageMap, setImageMap] = useState<Record<number, string>>({});
  const cancelPayment = useMutation({
    mutationFn: async (paymentSeq: number) => {
      const { data } = await authApi.post(`/frontWeb/payment/${paymentSeq}/cancel`, {
        socialAccountId,
        reason: '고객 요청',
      });
      return data?.body;
    },
    onSuccess: () => {
      toastSuccess('결제가 취소되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
    },
    onError: (error: { message?: string }) => {
      toastError(error?.message || '결제 취소 중 오류가 발생했습니다.');
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [router, status]);

  const imageTargets = useMemo(
    () =>
      orders.flatMap((order) =>
        (order.items ?? []).filter((item) => item.productImage).map((item) => ({ orderItemId: item.orderItemId, productImage: item.productImage as string })),
      ),
    [orders],
  );

  useEffect(() => {
    if (imageTargets.length === 0) {
      setImageMap((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    let alive = true;
    (async () => {
      const entries = await Promise.all(
        imageTargets.map(async (item) => {
          const url = await getFileUrl(item.productImage);
          return [item.orderItemId, url] as [number, string];
        }),
      );

      if (alive) {
        setImageMap(Object.fromEntries(entries.filter(([, url]) => Boolean(url))));
      }
    })();

    return () => {
      alive = false;
    };
  }, [getFileUrl, imageTargets]);

  const handleCancelPayment = (paymentSeq: number) => {
    if (cancelPayment.isPending) return;
    if (!window.confirm('결제를 취소하시겠습니까?')) return;
    cancelPayment.mutate(paymentSeq);
  };

  const applyRange = (nextFromDate = draftFromDate, nextToDate = draftToDate) => {
    const normalized = normalizeRange(nextFromDate, nextToDate);
    setDraftFromDate(normalized.fromDate);
    setDraftToDate(normalized.toDate);
    setFromDate(normalized.fromDate);
    setToDate(normalized.toDate);
  };

  const applyMonthRange = (months: number) => {
    const range = getRangeByMonths(months);
    setDraftFromDate(range.fromDate);
    setDraftToDate(range.toDate);
    setFromDate(range.fromDate);
    setToDate(range.toDate);
  };

  const renderFilter = () => (
    <section className={styles.filterBar}>
      <div className={styles.quickRanges}>
        {[1, 3, 6, 12].map((months) => (
          <button
            key={months}
            type="button"
            onClick={() => applyMonthRange(months)}
            className={fromDate === getRangeByMonths(months).fromDate ? styles.activeRange : ''}
          >
            {months === 12 ? '1년' : `${months}개월`}
          </button>
        ))}
      </div>
      <div className={styles.dateSearch}>
        <input type="date" value={draftFromDate} max={draftToDate} onChange={(event) => setDraftFromDate(event.target.value)} />
        <span>~</span>
        <input type="date" value={draftToDate} min={draftFromDate} max={defaultToDate()} onChange={(event) => setDraftToDate(event.target.value)} />
        <button type="button" onClick={() => applyRange()}>
          조회
        </button>
      </div>
    </section>
  );

  if (status === 'loading' || isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
          <h1>주문/결제 내역</h1>
          <p>최근 1개월 결제 내역을 불러오는 중입니다.</p>
        </div>
        {renderFilter()}
        <div className={styles.skeleton} />
      </main>
    );
  }

  if (isError) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
          <h1>주문/결제 내역</h1>
          <p>
            {fromDate} ~ {toDate}
          </p>
        </div>
        {renderFilter()}
        <div className={styles.empty}>
          <strong>주문 내역을 불러오지 못했습니다.</strong>
          <button type="button" onClick={() => refetch()}>
            다시 불러오기
          </button>
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
          <h1>주문/결제 내역</h1>
          <p>
            {fromDate} ~ {toDate}
          </p>
        </div>
        {renderFilter()}
        <div className={styles.empty}>
          <strong>조회 기간에 결제 내역이 없습니다.</strong>
          <span>기간을 넓히거나 마음에 드는 상품을 장바구니에 담아 첫 주문을 진행해보세요.</span>
          <Link href="/products/all">쇼핑 계속하기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>주문/결제 내역</h1>
          <p>
            {fromDate} ~ {toDate} · {orders.length}건
          </p>
        </div>
        <Link href="/products/all" className={styles.shopLink}>
          쇼핑 계속하기
        </Link>
      </div>

      {renderFilter()}

      <div className={styles.orderList}>
        {orders.map((order) => {
          const payment = order.payment;
          const items = order.items ?? [];
          const firstItem = items[0];
          const itemSummary = items.length > 1 ? `${firstItem?.productName ?? '상품'} 외 ${items.length - 1}건` : firstItem?.productName ?? '주문 상품';
          const paymentStatus = payment.paymentStatus ?? order.orderStatus;
          const paymentStatusLabel = payment.paymentStatusNm ?? payment.orderStatusNm ?? paymentStatus;
          const deliveryStatus = order.delivery?.deliveryStatus ?? payment.deliveryStatus;
          const deliveryStatusLabel = payment.deliveryStatusNm ?? deliveryStatus;
          const totalAmount = payment.totalAmount ?? order.productAmount;
          const paidAmount = payment.paymentAmount ?? order.paymentAmount;
          const usedPoint = payment.usedPoint ?? order.usedPoint;
          const cancellable = canCancelPayment(paymentStatus, deliveryStatus);

          return (
            <article key={`${payment.paymentSeq}-${payment.paymentId}-${order.orderNo}`} className={styles.orderCard}>
              <div className={styles.orderTop}>
                <div>
                  <span className={styles.orderDate}>{formatDate(payment.paidTm ?? payment.creTm ?? order.creTm)}</span>
                  <h2>{itemSummary}</h2>
                  <p>{order.orderNo}</p>
                </div>
                <div className={styles.statusGroup}>
                  <span className={`${styles.status} ${getStatusTone(paymentStatus)}`}>{paymentStatusLabel}</span>
                  {paymentStatus != 'C' && <span className={`${styles.status} ${getStatusTone(deliveryStatus)}`}>{deliveryStatusLabel}</span>}
                  {cancellable && (
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => handleCancelPayment(payment.paymentSeq)}
                      disabled={cancelPayment.isPending}
                    >
                      {cancelPayment.isPending ? '취소중' : '결제취소'}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.itemList}>
                {items.map((item) => (
                  <div key={`${order.orderNo}-${item.orderItemId}-${item.productDetId}`} className={styles.itemRow}>
                    <div className={styles.itemImage}>
                      {imageMap[item.orderItemId] ? <img src={imageMap[item.orderItemId]} alt={item.productName} /> : <span />}
                    </div>
                    <div className={styles.itemInfo}>
                      <strong>{item.productName}</strong>
                      {item.optionName && <span>{item.optionName}</span>}
                      <span>
                        {item.quantity}개 · {formatWon(item.unitPrice)}
                      </span>
                    </div>
                    <div className={styles.itemAmount}>{formatWon(item.paymentAmount)}</div>
                  </div>
                ))}
              </div>

              <div className={styles.metaGrid}>
                <div>
                  <span>총 상품금액</span>
                  <strong>{formatWon(totalAmount)}</strong>
                </div>
                <div>
                  <span>포인트 사용</span>
                  <strong>{formatWon(usedPoint)}</strong>
                </div>
                <div>
                  <span>실 결제금액</span>
                  <strong>{formatWon(paidAmount)}</strong>
                </div>
                <div>
                  <span>적립 예정</span>
                  <strong>{formatWon(payment.earnedPoint ?? order.earnedPoint)}</strong>
                </div>
              </div>

              <div className={styles.deliveryBox}>
                <span>배송지</span>
                <p>
                  {order.delivery?.receiverName ?? payment.receiverName ?? '-'} · {order.delivery?.receiverPhone ?? payment.receiverPhone ?? '-'}
                </p>
                <p>{[order.delivery?.address ?? payment.address, order.delivery?.addressDetail ?? payment.addressDetail].filter(Boolean).join(' ') || '-'}</p>
                {order.delivery?.invoiceNo || payment.invoiceNo ? (
                  <p>
                    {[order.delivery?.deliveryCompany ?? payment.deliveryCompany, order.delivery?.invoiceNo ?? payment.invoiceNo].filter(Boolean).join(' / ')}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
