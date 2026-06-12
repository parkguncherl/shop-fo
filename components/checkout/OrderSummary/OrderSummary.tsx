import React from 'react';
import styles from './OrderSummary.module.scss';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  size?: string | null;
  color?: string | null;
}

interface OrderSummaryProps {
  items: OrderItem[];
  shippingFee?: number;
  usedPoint?: number;
  expectedPoint?: number;
}

const FREE_SHIPPING_THRESHOLD = 50000;

export default function OrderSummary({ items, shippingFee, usedPoint = 0, expectedPoint = 0 }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = shippingFee ?? (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 3000);
  const total = Math.max(subtotal + shipping - usedPoint, 0);

  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>주문 상품</h3>

      <ul className={styles.items}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <div className={styles.itemInfo}>
              <p className={styles.itemName}>{item.name}</p>
              <p className={styles.itemOption}>
                {[item.size, item.color].filter(Boolean).join(' / ')}
                {item.quantity > 1 && ` x ${item.quantity}`}
              </p>
            </div>
            <span className={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()}원</span>
          </li>
        ))}
      </ul>

      <div className={styles.summary}>
        <div className={styles.row}>
          <span>상품 금액</span>
          <span>{subtotal.toLocaleString()}원</span>
        </div>
        <div className={styles.row}>
          <span>배송비</span>
          <span>{shipping === 0 ? '무료' : `${shipping.toLocaleString()}원`}</span>
        </div>
        <div className={styles.row}>
          <span>포인트 사용</span>
          <span>-{usedPoint.toLocaleString()}P</span>
        </div>
        <div className={styles.row}>
          <span>적립 예정</span>
          <span>{expectedPoint.toLocaleString()}P</span>
        </div>
        {subtotal < FREE_SHIPPING_THRESHOLD && (
          <p className={styles.freeShippingHint}>{(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()}원 더 담으면 무료배송</p>
        )}
        <div className={`${styles.row} ${styles.total}`}>
          <span>총 결제금액</span>
          <strong>{total.toLocaleString()}원</strong>
        </div>
      </div>
    </div>
  );
}