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
      <span className={styles.circle}>
        {totalCount > 99 ? '99+' : totalCount}
      </span>
    </Link>
  );
}
