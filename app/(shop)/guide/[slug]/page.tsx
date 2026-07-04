import React from 'react';
import { notFound } from 'next/navigation';
import GguaguStory from './GguaguStory';
import PersonalColorGuide from './PersonalColorGuide';
import styles from './page.module.scss';

const GUIDES: Record<string, { title: string; tag: string; content: React.ReactNode }> = {
  'brand-story': {
    title: '브랜드 소개',
    tag: '브랜드',
    content: <GguaguStory />,
  },
  'personal-color': {
    title: '나에게 맞는 컬러를 찾아서',
    tag: '컬러 가이드',
    content: <PersonalColorGuide />,
  },
};

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) notFound();

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <span className={styles.tag}>{guide.tag}</span>
        <h1 className={styles.title}>{guide.title}</h1>
      </header>
      <div className={styles.body}>{guide.content}</div>
    </main>
  );
}
