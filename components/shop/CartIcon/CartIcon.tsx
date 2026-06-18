'use client';
import React from 'react';
import Link from 'next/link';
import { useCartQuery } from '@/hooks/useCart';
import styles from './CartIcon.module.scss';

interface CartIconProps {
  className?: string;
}

export default function CartIcon({ className }: CartIconProps) {
  const { data } = useCartQuery();
  const totalCount = data?.totalCount ?? 0;

  return (
    <Link href="/cart" className={`${styles.wrap} ${className ?? ''}`} aria-label="장바구니">
      <div className={styles.iconWrap}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cartSvg}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {totalCount > 0 && (
          <span className={styles.badge}>
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </div>
    </Link>
  );
}
