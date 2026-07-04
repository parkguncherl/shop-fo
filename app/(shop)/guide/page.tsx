import React from 'react';
import Link from 'next/link';
import styles from './page.module.scss';

const GUIDE_ITEMS = [
  {
    slug: 'brand-story',
    no: 1,
    title: '브랜드 소개',
    summary: '나이가 들어도 이쁘게, 자연스럽고 편하게. 꾸안꾸가 추구하는 스타일 이야기.',
    tag: '브랜드',
    readingTime: '2분',
  },
  {
    slug: 'personal-color',
    no: 2,
    title: '나에게 맞는 컬러를 찾아서',
    summary: '퍼스널 컬러 진단으로 나만의 베스트 컬러를 찾아보세요.',
    tag: '컬러 가이드',
    readingTime: '3분',
  },
];

export default function GuidePage() {
  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>읽을거리</h1>
        <p className={styles.subtitle}>스타일링에 도움이 되는 이야기를 담았습니다.</p>
      </header>

      <ul className={styles.list}>
        {GUIDE_ITEMS.map((item) => (
          <li key={item.slug}>
            <Link href={`/guide/${item.slug}`} className={styles.card}>
              <span className={styles.cardNo}>{item.no}</span>
              <div className={styles.cardBody}>
                <span className={styles.tag}>{item.tag}</span>
                <strong className={styles.cardTitle}>{item.title}</strong>
                <p className={styles.cardSummary}>{item.summary}</p>
              </div>
              <span className={styles.readTime}>{item.readingTime}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
