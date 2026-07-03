import React from 'react';
import styles from './PersonalColorGuide.module.scss';

export default function PersonalColorGuide() {
  return (
    <article className={styles.article}>
      <section className={styles.section}>
        <img src="/images/guide/coolwarm.png" alt="쿨톤 웜톤 피부톤 확인 방법" className={styles.guideImg} />
      </section>
      <section className={styles.section}>
        <img src="/images/guide/seasonal.png" alt="4계절 퍼스널 컬러 색환" className={styles.guideImg} />
      </section>
    </article>
  );
}
