'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePartnerCode } from '@/hooks/usePartnerCode';
import styles from './Navigation.module.scss';

const SKELETON_COUNT = 5;

function NavigationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentCategory = searchParams.get('category');
  const [mounted, setMounted] = useState(false);

  const { data: categories, isLoading } = usePartnerCode('P0001');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('categories ==>', categories);
  }, [categories]);

  const isActive = (href: string) => {
    if (href === '/products' && !currentCategory) return true;
    const categoryMatch = href.match(/category=(\w+)/);
    if (categoryMatch) return currentCategory === categoryMatch[1];
    return false;
  };

  const skeletons = Array.from({ length: SKELETON_COUNT }, (_, i) => <span key={i} className={styles.skeleton} />);

  return (
    <nav className={styles.nav}>
      <div className={styles.scrollArea} ref={scrollRef}>
        <Link href="/products" className={`${styles.item} ${isActive('/products') ? styles.active : ''}`}>
          전체
        </Link>

        {!mounted || isLoading
          ? skeletons
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

function NavigationSkeleton() {
  return (
    <nav className={styles.nav}>
      <div className={styles.scrollArea}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <span key={i} className={styles.skeleton} />
        ))}
      </div>
    </nav>
  );
}

export default function Navigation() {
  return (
    <Suspense fallback={<NavigationSkeleton />}>
      <NavigationInner />
    </Suspense>
  );
}
