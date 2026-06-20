'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/libs/api';
import { PointResponseHistoryList, PointResponseHistoryPointType } from '@/generated';
import { Utils } from '@/libs/utils';
import styles from './PointHistory.module.scss';

const POINT_TYPE_LABEL: Record<string, string> = {
  [PointResponseHistoryPointType.Earn]:    '구매 적립',
  [PointResponseHistoryPointType.Use]:     '주문 사용',
  [PointResponseHistoryPointType.Restore]: '취소 환불',
  [PointResponseHistoryPointType.Review]:  '리뷰 적립',
  [PointResponseHistoryPointType.Expire]:  '만료',
  [PointResponseHistoryPointType.Admin]:   '관리자 지급',
};


export default function PointHistory() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const socialAccountId = session?.socialAccountId;

  const { data, isLoading } = useQuery<PointResponseHistoryList>({
    queryKey: ['pointHistory', socialAccountId],
    enabled: open && status === 'authenticated' && Boolean(socialAccountId),
    queryFn: async () => {
      const res = await authApi.get('/frontWeb/point/histories', {
        params: { socialAccountId },
      });
      return res.data?.body;
    },
  });

  if (status !== 'authenticated') return null;

  const balance = data?.pointBalance ?? 0;
  const histories = data?.histories ?? [];

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className={styles.toggleLabel}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
            <text x="10" y="14.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">P</text>
          </svg>
          포인트 내역
        </span>
        {data && (
          <span className={styles.balanceBadge}>
            보유 {balance.toLocaleString()}P
          </span>
        )}
        <svg
          className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`}
          width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={styles.panel}>
          {isLoading ? (
            <div className={styles.skeleton} />
          ) : histories.length === 0 ? (
            <p className={styles.empty}>포인트 내역이 없습니다.</p>
          ) : (
            <>
              <div className={styles.balanceRow}>
                <span>현재 보유 포인트</span>
                <strong>{balance.toLocaleString()}P</strong>
              </div>
              <ul className={styles.list}>
                {histories.map((h) => {
                  const isEarn = h.pointAmount > 0;
                  return (
                    <li key={h.id} className={styles.row}>
                      <div className={styles.rowLeft}>
                        <span className={`${styles.typeBadge} ${isEarn ? styles.earn : styles.use}`}>
                          {POINT_TYPE_LABEL[h.pointType] ?? h.pointType}
                        </span>
                        <span className={styles.desc}>
                          {h.description || (h.orderId ? `주문 #${h.orderId}` : '-')}
                        </span>
                      </div>
                      <div className={styles.rowRight}>
                        <span className={`${styles.amount} ${isEarn ? styles.amountEarn : styles.amountUse}`}>
                          {isEarn ? '+' : ''}{h.pointAmount.toLocaleString()}P
                        </span>
                        <span className={styles.date}>{Utils.formatDate(h.creTm)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
