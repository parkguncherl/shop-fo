'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartQuery, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/hooks/useCart';
import { toastError } from '@/components/common/Others/ToastMessage';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import styles from './CartPage.module.scss';

export default function CartPage() {
  const router = useRouter();
  const { data: cart, isLoading } = useCartQuery();
  const { mutate: updateItem } = useUpdateCartItem();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveCartItem();
  const { mutate: clearCart, isPending: isClearing } = useClearCart();
  const getFileUrl = useWebCommonStore((s) => s.getFileUrl);

  const items = cart?.items ?? [];

  // sysFileNm → 실제 URL 변환
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!items.length) return;
    (async () => {
      const entries = await Promise.all(
        items.map(async (item) => {
          console.log('[Cart] productImage raw:', item.productImage);
          const url = item.productImage ? await getFileUrl(item.productImage) : null;
          console.log('[Cart] getFileUrl result:', url);
          return [item.cartItemId, url] as [number, string | null];
        }),
      );
      const validEntries = entries.filter((entry): entry is [number, string] => entry[1] !== null);
      setImageMap(Object.fromEntries(validEntries));
    })();
  }, [cart?.items?.map((i) => i.cartItemId).join(',')]);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(() => new Set(items.map((i) => i.cartItemId)));

  // 새 아이템이 생기면 자동 체크한다.
  React.useEffect(() => {
    setCheckedIds(new Set(items.map((i) => i.cartItemId)));
  }, [items.length]);

  /* ── 체크박스 ──────────────────────────────────────────── */
  const isAllChecked = items.length > 0 && checkedIds.size === items.length;

  const toggleAll = () => setCheckedIds(isAllChecked ? new Set() : new Set(items.map((i) => i.cartItemId)));

  const toggleItem = (cartItemId: number) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(cartItemId) ? next.delete(cartItemId) : next.add(cartItemId);
      return next;
    });

  /* ── 선택 삭제 ────────────────────────────────────────── */
  const handleDeleteChecked = () => {
    if (checkedIds.size === 0) {
      toastError('삭제할 상품을 선택해주세요.');
      return;
    }
    checkedIds.forEach((id) => removeItem(id));
    setCheckedIds(new Set());
  };

  /* ── 선택 합계 ───────────────────────────────────────── */
  const checkedItems = items.filter((i) => checkedIds.has(i.cartItemId));
  const checkedTotal = checkedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const checkedCount = checkedItems.reduce((s, i) => s + i.quantity, 0);
  const deliveryFee = checkedTotal > 0 && checkedTotal < 50000 ? 3000 : 0;
  const finalTotal = checkedTotal + deliveryFee;

  /* ── 로딩 ────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>장바구니</h1>
        </div>
        <div className={styles.skeleton} />
      </div>
    );
  }

  /* ── 빈 장바구니 ──────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <path d="M8 8h5l6 28h24l4-16H18" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="46" r="2.5" fill="#ccc" />
            <circle cx="40" cy="46" r="2.5" fill="#ccc" />
          </svg>
        </div>
        <p className={styles.emptyText}>장바구니가 비어있습니다</p>
        <Link href="/" className={styles.emptyBtn}>
          쇼핑 계속하기
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>장바구니</h1>
        <span className={styles.count}>{items.length}개</span>
      </div>

      <div className={styles.layout}>
        {/* ── 왼쪽: 아이템 목록 ── */}
        <div className={styles.left}>
          {/* 전체선택 / 선택삭제 */}
          <div className={styles.toolbar}>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={isAllChecked} onChange={toggleAll} className={styles.checkbox} />
              전체선택 ({checkedIds.size}/{items.length})
            </label>
            <button className={styles.deleteBtn} onClick={handleDeleteChecked} disabled={isRemoving}>
              선택삭제
            </button>
          </div>

          {/* 아이템 목록 */}
          <ul className={styles.itemList}>
            {items.map((item) => {
              const isChecked = checkedIds.has(item.cartItemId);
              return (
                <li key={item.cartItemId} className={`${styles.item} ${!isChecked ? styles.itemDimmed : ''}`}>
                  {/* 체크박스 */}
                  <label className={styles.itemCheck}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleItem(item.cartItemId)} className={styles.checkbox} />
                  </label>

                  {/* 이미지 */}
                  <div className={styles.itemImage}>
                    {imageMap[item.cartItemId] ? <img src={imageMap[item.cartItemId]} alt={item.productName} /> : <div className={styles.imagePlaceholder} />}
                  </div>

                  {/* 상품 정보 */}
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.productName}</p>
                    {(item.productDetColor || item.productDetSize) && (
                      <p className={styles.itemOption}>{[item.productDetColor, item.productDetSize].filter(Boolean).join(' / ')}</p>
                    )}

                    {/* 수량 조절 */}
                    <div className={styles.qtyWrap}>
                      <button
                        className={styles.qtyBtn}
                        disabled={item.quantity <= 1}
                        onClick={() => updateItem({ cartItemId: item.cartItemId, quantity: item.quantity - 1 })}
                      >
                        −
                      </button>
                      <span className={styles.qty}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateItem({ cartItemId: item.cartItemId, quantity: item.quantity + 1 })}>
                        +
                      </button>
                    </div>

                    <p className={styles.itemPrice}>{(item.unitPrice * item.quantity).toLocaleString()}원</p>
                  </div>

                  {/* 삭제 */}
                  <button
                    className={styles.removeBtn}
                    aria-label="삭제"
                    onClick={() => {
                      removeItem(item.cartItemId);
                      setCheckedIds((prev) => {
                        const n = new Set(prev);
                        n.delete(item.cartItemId);
                        return n;
                      });
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>

          <button className={styles.clearBtn} onClick={() => clearCart()} disabled={isClearing}>
            {isClearing ? '비우는 중...' : '장바구니 비우기'}
          </button>
        </div>

        {/* ── 오른쪽: 주문 요약 ── */}
        <div className={styles.right}>
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>주문 요약</h2>

            <div className={styles.summaryRow}>
              <span>선택 상품 ({checkedCount}개)</span>
              <span>{checkedTotal.toLocaleString()}원</span>
            </div>
            <div className={styles.summaryRow}>
              <span>배송비</span>
              <span>{deliveryFee === 0 && checkedTotal > 0 ? '무료' : deliveryFee === 0 ? '-' : `${deliveryFee.toLocaleString()}원`}</span>
            </div>

            <div className={styles.summaryDivider} />

            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>총 결제금액</span>
              <span>{checkedTotal === 0 ? '0원' : `${finalTotal.toLocaleString()}원`}</span>
            </div>

            <button
              className={styles.orderBtn}
              disabled={checkedIds.size === 0}
              onClick={() => {
                if (checkedIds.size === 0) {
                  toastError('주문할 상품을 선택해주세요.');
                  return;
                }
                router.push('/checkout');
              }}
            >
              주문하기 ({checkedCount}개)
            </button>

            <p className={styles.freeShipping}>
              {checkedTotal > 0 && checkedTotal < 50000
                ? `${(50000 - checkedTotal).toLocaleString()}원 더 담으면 무료배송!`
                : checkedTotal >= 50000
                ? '✓ 무료배송 적용'
                : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
