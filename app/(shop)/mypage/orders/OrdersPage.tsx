'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/libs/api';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { toastError, toastSuccess } from '@/components/common/Others/ToastMessage';
import { useConfirm } from '@/components/common/ConfirmModal/ConfirmProvider';
import ReviewForm from './ReviewForm';
import ComuChat from './ComuChat';
import styles from './OrdersPage.module.scss';
import { OrderResponseInfo, PaymentResponseListItem, ReviewResponseMyItem } from '@/generated';
import { Utils } from '@/libs/utils';

// payment 를 항상 포함한 조합 행 (generated 타입 extend)
interface OrderHistoryRow extends OrderResponseInfo {
  payment: PaymentResponseListItem;
}

const EMPTY_ORDER_HISTORY: OrderHistoryRow[] = [];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

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

      const orders = (orderRes.data?.body ?? []) as OrderResponseInfo[];
      const payments = (paymentRes.data?.body ?? []) as PaymentResponseListItem[];
      const orderMap = new Map(orders.map((order) => [order.orderNo, order]));

      return payments
        .map((payment) => {
          const order = orderMap.get(payment.orderNo!);
          if (!order) return null;
          return { ...order, payment };
        })
        .filter((row): row is OrderHistoryRow => row !== null)
        .sort((a, b) => new Date(b.payment.paidTm ?? b.payment.creTm ?? 0).getTime() - new Date(a.payment.paidTm ?? a.payment.creTm ?? 0).getTime());
    },
  });
};

// existingReview 는 generated ReviewResponseMyItem 그대로 사용
interface ReviewFormTarget {
  orderItemId: number;
  productId: number;
  productDetId?: number | null;
  productName: string;
  existingReview?: ReviewResponseMyItem | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const socialAccountId = session?.socialAccountId;
  const [reviewTarget, setReviewTarget] = useState<ReviewFormTarget | null>(null);
  const [comuTarget, setComuTarget] = useState<{ orderId: number; orderNo: string; paymentStatus: string } | null>(null);
  const [draftFromDate, setDraftFromDate] = useState(defaultFromDate);
  const [draftToDate, setDraftToDate] = useState(defaultToDate);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: orderData, isLoading, isError, refetch } = useOrderHistoryQuery(socialAccountId, fromDate, toDate);

  const { data: myReviews } = useQuery<ReviewResponseMyItem[]>({
    queryKey: ['myReviews', socialAccountId],
    enabled: Boolean(socialAccountId),
    queryFn: async () => {
      const res = await authApi.get('/frontWeb/review/my', { params: { socialAccountId } });
      return res.data?.body ?? [];
    },
  });
  const reviewedMap = useMemo(() => {
    const map = new Map<number, ReviewResponseMyItem>();
    (myReviews ?? []).forEach((r) => map.set(r.orderItemId!, r));
    return map;
  }, [myReviews]);
  const orders = orderData ?? EMPTY_ORDER_HISTORY;
  const getFileUrl = useWebCommonStore((state) => state.getFileUrl);
  const [imageMap, setImageMap] = useState<Record<number, string>>({});

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const { data } = await authApi.delete('/frontWeb/login/withdraw', { params: { socialAccountId } });
      if (data?.resultCode !== 200) throw new Error(data?.resultMessage ?? '탈퇴 처리 중 오류가 발생했습니다.');
    },
    onSuccess: async () => {
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: '/' });
    },
    onError: (error: any) => {
      toastError(error?.message ?? '탈퇴 처리 중 오류가 발생했습니다.');
    },
  });

  const handleWithdraw = async () => {
    const ok = await confirm('정말 탈퇴하시겠습니까?\n탈퇴 시 개인정보가 즉시 삭제되며 복구할 수 없습니다.');
    if (!ok) return;
    withdrawMutation.mutate();
  };

  const cancelPayment = useMutation({
    mutationFn: async (paymentSeq: number) => {
      const { data } = await authApi.post(`/frontWeb/payment/${paymentSeq}/cancel`, {
        socialAccountId,
        reason: '고객 요청',
      });
      if (data?.resultCode !== 200) {
        throw new Error(data?.resultMessage ?? '결제 취소 중 오류가 발생했습니다.');
      }
      return data?.body;
    },
    onSuccess: (data: any) => {
      if (data?.alreadyCancelled) {
        toastSuccess('이미 결제가 취소되어 있습니다.');
      } else {
        toastSuccess('결제가 취소되었습니다.');
      }
      queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
    },
    onError: (error: any) => {
      toastError(error?.message ?? '결제 취소 중 오류가 발생했습니다.');
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

  const handleCancelPayment = async (paymentSeq: number) => {
    if (cancelPayment.isPending) return;
    const confirmed = await confirm({
      title: '결제 취소',
      message: '결제를 취소하시겠습니까?',
      description: '취소 후에는 결제 상태와 주문 진행 정보가 변경됩니다.',
      confirmText: '결제 취소',
      tone: 'danger',
    });
    if (!confirmed) return;
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
                  <span className={styles.orderDate}>{Utils.formatDateTime(payment.paidTm ?? payment.creTm ?? order.creTm)}</span>
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
                  <button
                    type="button"
                    className={styles.inquiryBtn}
                    onClick={() => setComuTarget({ orderId: order.orderId, orderNo: order.orderNo, paymentStatus })}
                  >
                    문의하기
                  </button>
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
                        {item.quantity}개 · {Utils.formatWon(item.unitPrice)}
                      </span>
                    </div>
                    <div className={styles.itemAmount}>
                      {Utils.formatWon(item.paymentAmount)}
                      {paymentStatus === 'P' && (
                        reviewedMap.has(item.orderItemId) ? (
                          <button
                            type="button"
                            className={styles.reviewDoneBtn}
                            onClick={() => setReviewTarget({
                              orderItemId: item.orderItemId,
                              productId: item.productId,
                              productDetId: item.productDetId,
                              productName: item.productName,
                              existingReview: reviewedMap.get(item.orderItemId),
                            })}
                          >
                            리뷰 수정
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.reviewBtn}
                            onClick={() => setReviewTarget({
                              orderItemId: item.orderItemId,
                              productId: item.productId,
                              productDetId: item.productDetId,
                              productName: item.productName,
                            })}
                          >
                            리뷰 작성
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.metaGrid}>
                <div>
                  <span>총 상품금액</span>
                  <strong>{Utils.formatWon(totalAmount)}</strong>
                </div>
                <div>
                  <span>포인트 사용</span>
                  <strong>{Utils.formatWon(usedPoint)}</strong>
                </div>
                <div>
                  <span>실 결제금액</span>
                  <strong>{Utils.formatWon(paidAmount)}</strong>
                </div>
                <div>
                  <span>적립 예정</span>
                  <strong>{Utils.formatWon(payment.earnedPoint ?? order.earnedPoint)}</strong>
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

      {comuTarget && (
        <ComuChat
          orderId={comuTarget.orderId}
          orderNo={comuTarget.orderNo}
          socialAccountId={socialAccountId!}
          paymentStatus={comuTarget.paymentStatus}
          onClose={() => setComuTarget(null)}
        />
      )}

      {reviewTarget && (
        <ReviewForm
          socialAccountId={socialAccountId!}
          orderItemId={reviewTarget.orderItemId}
          productId={reviewTarget.productId}
          productDetId={reviewTarget.productDetId}
          productName={reviewTarget.productName}
          existingReview={reviewTarget.existingReview}
          onClose={() => setReviewTarget(null)}
        />
      )}

      <div className={styles.withdrawWrap}>
        <button className={styles.withdrawBtn} onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
          회원 탈퇴
        </button>
      </div>
    </main>
  );
}
