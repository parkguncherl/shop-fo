'use client';
import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import styles from './CartIcon.module.scss';

interface CartIconProps {
  className?: string;
}

export default function CartIcon({ className }: CartIconProps) {
  const totalCount = useCartStore((s) => s.totalCount());

  return (
    <Link href="/cart" className={`${styles.wrap} ${className ?? ''}`} aria-label="장바구니">
      <span className={styles.circle}>{totalCount > 99 ? '99+' : totalCount}</span>
    </Link>
  );
}
