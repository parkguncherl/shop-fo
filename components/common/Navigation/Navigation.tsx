'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePartnerCode } from '@/hooks/usePartnerCode';
import styles from './Navigation.module.scss';

export default function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentCategory = searchParams.get('category');

  // API에서 카테고리 목록 조회
  const { data: categories, isLoading } = usePartnerCode('P0001');

  useEffect(() => {
    console.log('categories ==>', categories);
  }, [categories]);

  const isActive = (href: string) => {
    if (href === '/products' && !currentCategory) return true;
    const categoryMatch = href.match(/category=(\w+)/);
    if (categoryMatch) return currentCategory === categoryMatch[1];
    return false;
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.scrollArea} ref={scrollRef}>
        {/* 전체 고정 */}
        <Link href="/products" className={`${styles.item} ${isActive('/products') ? styles.active : ''}`}>
          전체
        </Link>

        {/* API에서 동적 생성 */}
        {isLoading
          ? // 로딩 중 스켈레톤
            Array.from({ length: 5 }).map((_, i) => <span key={i} className={styles.skeleton} />)
          : categories?.map((cat) => (
              <Link
                key={cat.codeCd}
                href={`/products?category=${cat.codeCd}`}
                className={`${styles.item} ${currentCategory === cat.codeCd ? styles.active : ''}`}
              >
                {cat.codeNm}
              </Link>
            ))}
      </div>
    </nav>
  );
}
