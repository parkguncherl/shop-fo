import React from 'react';
import styles from './GguaguStory.module.scss';

const CONCEPTS = [
  {
    no: 1,
    icon: '♻️',
    title: '리사이클링 탭',
    desc: '입던 옷을 주고받는 문화. 자동화된 활동 포인트 적립과 함께 순환하는 패션을 만들어갑니다.',
    badge: '주고받기',
  },
  {
    no: 2,
    icon: '✏️',
    title: '만들어 주세요',
    desc: '원하는 스타일을 직접 제안하세요. 고객 의견을 반영해 실제 제품으로 만들어드리는 커스텀 코너입니다.',
    badge: '의견 탭',
  },
  {
    no: 3,
    icon: '👘',
    title: '개량 한복 스타일',
    desc: '중년의 몸에 편한 실루엣, 개구쟁이 같은 발랄함과 엉뚱함이 공존하는 꾸안꾸만의 한복 라인.',
    badge: '한복 퓨전',
  },
  {
    no: 4,
    icon: '🧵',
    title: '기능성 스타일',
    desc: '팔뚝·허리·엉덩이·허벅지에 스판 소재를 적용. 보기 좋으면서도 움직임이 자유로운 특별 재질.',
    badge: '스판 · 기능성',
  },
  {
    no: 5,
    icon: '🎨',
    title: '화려한 포인트',
    desc: '단조롭지 않게, 컬러와 디테일로 포인트를 더합니다. 입을수록 애착이 생기는 꾸안꾸의 시그니처.',
    badge: '포인트 디자인',
  },
];

function LogoBadge() {
  return (
    <div className={styles.logoBadge}>
      <img src="/images/guide/gguangu-origin.png" alt="꾸안꾸 로고 원본 스케치" className={styles.logoImg} />
      <p className={styles.logoCaption}>꾸안꾸 로고 초안 스케치</p>
    </div>
  );
}

export default function GguaguStory() {
  return (
    <article className={styles.article}>
      {/*
      <p className={styles.lead}>
        꾸안꾸는 <strong>`나이가 들어도 이쁘게 입자 티나지 않게`</strong>를 모토로 합니다. <strong>나를 포기하지 마세요</strong> 자연럽고 깔끔한 옷 차림이
        서로에게 많은것을 줄수 있습니다. <span className={styles.purple}>66사이즈여도 40 대 이상이 입을수 있는 66 사이즈 편하고 자유로우면서도 이쁜!!!</span>
      </p>
*/}

      <LogoBadge />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>꾸안꾸가 추구하는 5가지</h2>
        <ul className={styles.conceptList}>
          {CONCEPTS.map((c) => (
            <li key={c.no} className={styles.conceptItem}>
              <div className={styles.conceptTop}>
                <span className={styles.conceptNo}>{c.no}</span>
                <span className={styles.conceptIcon}>{c.icon}</span>
                <div className={styles.conceptMeta}>
                  <strong className={styles.conceptTitle}>{c.title}</strong>
                  <span className={styles.conceptBadge}>{c.badge}</span>
                </div>
              </div>
              <p className={styles.conceptDesc}>{c.desc}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
