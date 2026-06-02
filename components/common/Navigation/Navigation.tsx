'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePartnerCode } from '@/hooks/usePartnerCode';
import styles from './Navigation.module.scss';

const SKELETON_COUNT = 5;

function NavigationInner() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: categories, isLoading } = usePartnerCode('P0001');
  const skeletons = Array.from({ length: SKELETON_COUNT }, (_, i) => <span key={i} className={styles.skeleton} />);

  return (
    <nav className={styles.nav}>
      <div className={styles.scrollArea} ref={scrollRef}>
        <Link href="/" className={`${styles.item} ${pathname == '/' ? styles.active : ''}`}>
          전체
        </Link>

        {isLoading
          ? skeletons
          : categories?.map((category) => (
              <Link
                key={category.codeCd}
                href={`/products/${category.codeCd}`}
                className={`${styles.item} ${pathname === '/products/' + category.codeCd ? styles.active : ''}`}
              >
                {category.codeNm}
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
