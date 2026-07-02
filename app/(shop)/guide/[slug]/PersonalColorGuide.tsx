import React from 'react';
import styles from './PersonalColorGuide.module.scss';

export default function PersonalColorGuide() {
  return (
    <article className={styles.article}>
      <p className={styles.lead}>
        내 피부톤과 어울리는 색을 알면 더 건강하고 생기 있어 보일 수 있어요. 아래 두 가지 방법으로 나의 퍼스널 컬러를 찾아보세요.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. 나는 쿨톤? 웜톤?</h2>
        <p className={styles.sectionDesc}>
          자연광에서 흰 종이를 얼굴 옆에 대고 피부 색감을 비교해 보세요. 창가에서 비교하면 더 정확합니다.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/guide/coolwarm.png" alt="쿨톤 웜톤 피부톤 확인 방법" className={styles.guideImg} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. 나의 계절 타입은?</h2>
        <p className={styles.sectionDesc}>
          쿨/웜톤은 다시 밝기에 따라 봄·여름·가을·겨울로 나뉩니다. 내 계절 타입에 맞는 컬러 팔레트를 참고해 옷을 골라보세요.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/guide/seasonal.png" alt="4계절 퍼스널 컬러 색환" className={styles.guideImg} />
      </section>
    </article>
  );
}
