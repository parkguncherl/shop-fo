'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartQuery } from '@/hooks/useCart';
import styles from './MobileNav.module.scss';

const NAV_ITEMS = [
  {
    href: '/',
    label: '홈',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5H8v5H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/products',
    label: '카테고리',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="12" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="12" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="12" y="12" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: '/search',
    label: '검색',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M15 15l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/mypage/wishlist',
    label: '찜',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 18.5S3 13.5 3 8a5 5 0 019.5-2.2A5 5 0 0119 8c0 5.5-8 10.5-8 10.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/mypage',
    label: '마이',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 19c0-3.866 3.582-7 8-7s8 3.134 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { data: cartData } = useCartQuery();
  const displayCount = cartData?.totalCount ?? 0;

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const isCart = item.href === '/cart';

        return (
          <Link key={item.href} href={item.href} className={`${styles.item} ${isActive ? styles.active : ''}`}>
            <span className={styles.iconWrap}>
              {item.icon}
              {isCart && displayCount > 0 && <span className={styles.badge}>{displayCount > 9 ? '9+' : displayCount}</span>}
            </span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
