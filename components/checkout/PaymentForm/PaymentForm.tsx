'use client';
import React, { useMemo, useState } from 'react';
import Button from '@/components/common/Button/Button';
import type { PaymentMethod } from '@/hooks/useCheckout';
import styles from './PaymentForm.module.scss';

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'CARD', label: '신용/체크카드' },
  { value: 'NAVER_PAY', label: '네이버페이' },
  { value: 'KAKAO_PAY', label: '카카오페이' },
  { value: 'TOSS_PAY', label: '토스페이' },
  { value: 'VIRTUAL_ACCOUNT', label: '가상계좌' },
  { value: 'BANK_TRANSFER', label: '계좌이체' },
];

interface PaymentFormProps {
  productAmount: number;
  pointBalance: number;
  usedPoint: number;
  onUsedPointChange: (point: number) => void;
  onPay: (method: PaymentMethod) => void;
  loading?: boolean;
}

export default function PaymentForm({ productAmount, pointBalance, usedPoint, onUsedPointChange, onPay, loading = false }: PaymentFormProps) {
  const [selected, setSelected] = useState<PaymentMethod>('CARD');
  const [agreed, setAgreed] = useState(false);

  const maxUsablePoint = Math.min(pointBalance, productAmount);
  const pgAmount = Math.max(productAmount - usedPoint, 0);
  const expectedPoint = useMemo(() => Math.floor(pgAmount * 0.02), [pgAmount]);

  const handlePointChange = (value: string) => {
    const point = Number(value.replace(/[^0-9]/g, '')) || 0;
    onUsedPointChange(Math.min(point, maxUsablePoint));
  };

  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>결제 수단</h3>

      <div className={styles.pointBox}>
        <div className={styles.pointHeader}>
          <span>포인트 사용</span>
          <strong>보유 {pointBalance.toLocaleString()}P</strong>
        </div>
        <div className={styles.pointInputRow}>
          <input
            value={usedPoint.toLocaleString()}
            onChange={(e) => handlePointChange(e.target.value)}
            inputMode="numeric"
            className={styles.pointInput}
            aria-label="사용 포인트"
          />
          <button type="button" className={styles.pointBtn} onClick={() => onUsedPointChange(maxUsablePoint)}>
            전액사용
          </button>
        </div>
      </div>

      {pgAmount > 0 && (
        <div className={styles.methods}>
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`${styles.method} ${selected === m.value ? styles.selected : ''}`}
              onClick={() => setSelected(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div className={styles.amountBox}>
        <div>
          <span>PG 결제금액</span>
          <strong>{pgAmount.toLocaleString()}원</strong>
        </div>
        <div>
          <span>적립 예정</span>
          <strong>{expectedPoint.toLocaleString()}P</strong>
        </div>
      </div>

      <label className={styles.agree}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className={styles.checkbox} />
        <span>주문 상품, 결제금액, 개인정보 제공 및 구매 조건을 확인했습니다.</span>
      </label>

      <Button size="full" loading={loading} disabled={!agreed} onClick={() => onPay(selected)} className={styles.payBtn}>
        {pgAmount === 0 ? '포인트로 결제하기' : `${pgAmount.toLocaleString()}원 결제하기`}
      </Button>
    </div>
  );
}