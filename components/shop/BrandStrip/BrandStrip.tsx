'use client';
import React from 'react';
import Link from 'next/link';
import styles from './BrandStrip.module.scss';

const CONCEPTS = [
  { icon: '♻️', label: '리사이클링' },
  { icon: '✏️', label: '만들어주세요' },
  { icon: '👘', label: '개량한복' },
  { icon: '🧵', label: '기능성' },
  { icon: '🎨', label: '화려한 포인트' },
];

export default function BrandStrip() {
  return (
    <Link href="/guide/brand-story" className={styles.strip}>
      <div className={styles.inner}>
        <span className={styles.brandName}>맵시꾼</span>
        <span className={styles.divider} />
        <div className={styles.conceptRow}>
          {CONCEPTS.map((c, i) => (
            <span key={i} className={styles.concept}>
              <span className={styles.conceptIcon}>{c.icon}</span>
              <span className={styles.conceptLabel}>{c.label}</span>
            </span>
          ))}
        </div>
        <span className={styles.arrow}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
