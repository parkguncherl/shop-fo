import styles from './page.module.scss';

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>ABOUT US</p>
        <h1>
          Welcome to <span className={styles.brand}>'꾸안꾸'</span> ✨
        </h1>
      </header>

      <ul className={styles.featureList}>
        <li className={styles.featureItem}>
          <div className={styles.featureMark}>✔</div>
          <div className={styles.featureBody}>
            <h2>진짜 편한 옷</h2>
            <p>
              같은 66·77 사이즈라도 진짜 편한 옷을 만들었습니다. 나의 체형을 배려한 여유로운 핏과 스타일을
              느껴보세요.
            </p>
          </div>
        </li>

        <li className={styles.featureItem}>
          <div className={styles.featureMark}>✔</div>
          <div className={styles.featureBody}>
            <h2>디자이너의 계절 제안</h2>
            <p>
              코디가 고민될 때는 <strong>[SEASON]</strong> 메뉴를 찾아주세요. 전속 디자이너가 추천하는 계절별
              맞춤 코디로 매일이 즐거워집니다.
            </p>
          </div>
        </li>

        <li className={styles.featureItem}>
          <div className={styles.featureMark}>✔</div>
          <div className={styles.featureBody}>
            <h2>과감한 컬러 매칭</h2>
            <p>
              옷은 편안함과 색상의 조화입니다. 나에게 어울리는 컬러와 스타일로 당신의 일상을 더 아름답게
              물들여 보세요.
            </p>
          </div>
        </li>
      </ul>
    </main>
  );
}
