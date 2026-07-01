'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
    href: '/guide',
    label: '읽을거리',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 3h7v16H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11 3h7a1 1 0 011 1v14a1 1 0 01-1 1h-7V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="11" y1="3" x2="11" y2="19" stroke="currentColor" strokeWidth="1" />
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
    authHref: '/mypage/orders',
    loginHref: '/login',
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: cartData } = useCartQuery();
  const displayCount = cartData?.totalCount ?? 0;

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const href = item.authHref
          ? session ? item.authHref : item.loginHref!
          : item.href;
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const isCart = item.href === '/cart';

        return (
          <Link key={item.href} href={href} className={`${styles.item} ${isActive ? styles.active : ''}`}>
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
