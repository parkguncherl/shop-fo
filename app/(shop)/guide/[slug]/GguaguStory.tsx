import React from 'react';
import styles from './GguaguStory.module.scss';


const FEATURES = [
  {
    title: '진짜 편한 옷',
    desc: '같은 66·77 사이즈라도 진짜 편한 옷을 만들었습니다. 나의 체형을 배려한 여유로운 핏과 스타일을 느껴보세요.',
  },
  {
    title: '디자이너의 계절 제안',
    desc: '코디가 고민될 때는 [SEASON] 메뉴를 찾아주세요. 전속 디자이너가 추천하는 계절별 맞춤 코디로 매일이 즐거워집니다.',
  },
  {
    title: '과감한 컬러 매칭',
    desc: '옷은 편안함과 색상의 조화입니다. 나에게 어울리는 컬러와 스타일로 당신의 일상을 더 아름답게 물들여 보세요.',
  },
];

export default function GguaguStory() {
  return (
    <article className={styles.article}>
      <section className={styles.section}>
        <p className={styles.eyebrow}>ABOUT US</p>
        <h2 className={styles.sectionTitle}>Welcome to <em>꾸안꾸</em> ✨</h2>
        <ul className={styles.featureList}>
          {FEATURES.map((f) => (
            <li key={f.title} className={styles.featureItem}>
              <div className={styles.featureMark}>✔</div>
              <div className={styles.featureBody}>
                <strong className={styles.featureTitle}>{f.title}</strong>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

    </article>
  );
}
