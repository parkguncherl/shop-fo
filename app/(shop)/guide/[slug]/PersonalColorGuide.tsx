import React from 'react';
import styles from './PersonalColorGuide.module.scss';

function CoolWarmDiagram() {
  return (
    <svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" className={styles.svg} aria-label="쿨톤 웜톤 비교 다이어그램">
      <rect x="0" y="0" width="178" height="220" rx="16" fill="#F0F4FF" />
      <text x="89" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#5B6FA8" letterSpacing="2">COOL TONE</text>
      <ellipse cx="89" cy="80" rx="32" ry="38" fill="#E8D5CC" />
      <ellipse cx="89" cy="58" rx="28" ry="24" fill="#DBBFBA" />
      <ellipse cx="89" cy="80" rx="32" ry="38" fill="rgba(100,120,180,0.12)" />
      <rect x="18" y="132" width="30" height="30" rx="6" fill="#B8C5E0" />
      <rect x="54" y="132" width="30" height="30" rx="6" fill="#C9A8C0" />
      <rect x="90" y="132" width="30" height="30" rx="6" fill="#8EB5C8" />
      <rect x="126" y="132" width="30" height="30" rx="6" fill="#A8C4B0" />
      <text x="89" y="180" textAnchor="middle" fontSize="10" fill="#5B6FA8" fontWeight="500">블루 · 퍼플 · 핑크 · 민트</text>
      <text x="89" y="196" textAnchor="middle" fontSize="10" fill="#8A97B8">차갑고 선명한 색조</text>
      <line x1="180" y1="16" x2="180" y2="204" stroke="#E0E0E0" strokeWidth="1" strokeDasharray="4 3" />
      <rect x="182" y="0" width="178" height="220" rx="16" fill="#FFF8F0" />
      <text x="271" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#A87B3A" letterSpacing="2">WARM TONE</text>
      <ellipse cx="271" cy="80" rx="32" ry="38" fill="#E8C89A" />
      <ellipse cx="271" cy="58" rx="28" ry="24" fill="#D4A870" />
      <ellipse cx="271" cy="80" rx="32" ry="38" fill="rgba(200,140,60,0.10)" />
      <rect x="200" y="132" width="30" height="30" rx="6" fill="#E8B87A" />
      <rect x="236" y="132" width="30" height="30" rx="6" fill="#D4856A" />
      <rect x="272" y="132" width="30" height="30" rx="6" fill="#C8A060" />
      <rect x="308" y="132" width="30" height="30" rx="6" fill="#9DAE7A" />
      <text x="271" y="180" textAnchor="middle" fontSize="10" fill="#A87B3A" fontWeight="500">오렌지 · 코럴 · 카키 · 올리브</text>
      <text x="271" y="196" textAnchor="middle" fontSize="10" fill="#B8956A">따뜻하고 부드러운 색조</text>
    </svg>
  );
}

type Outfit = {
  top: { color: string; label: string; bold?: boolean };
  bottom: { color: string; label: string; bold?: boolean };
};

type Season = {
  name: string;
  label: string;
  bg: string;
  headerBg: string;
  headerText: string;
  desc: string;
  colors: string[];
  keywords: string[];
  outfits: Outfit[];
};

function OutfitPair({ outfit }: { outfit: Outfit }) {
  return (
    <div className={styles.outfitPair}>
      {/* 상의 — 퍼스널 컬러 포인트 */}
      <div className={styles.outfitItem}>
        <div className={`${styles.clothBlock} ${styles.topBlock} ${styles.boldColor}`} style={{ background: outfit.top.color }} />
        <span className={styles.clothLabel}>{outfit.top.label}</span>
        <span className={styles.clothRole}>상의 · 포인트</span>
      </div>
      <span className={styles.outfitPlus}>+</span>
      {/* 하의 — 중립 베이스 */}
      <div className={styles.outfitItem}>
        <div className={`${styles.clothBlock} ${styles.bottomBlock} ${styles.muteColor}`} style={{ background: outfit.bottom.color }} />
        <span className={styles.clothLabel}>{outfit.bottom.label}</span>
        <span className={styles.clothRole}>하의 · 베이스</span>
      </div>
    </div>
  );
}

function SeasonalColorChart() {
  const seasons: Season[] = [
    {
      name: 'Spring',
      label: '봄 웜톤',
      bg: '#FFF5E6',
      headerBg: '#F0A84A',
      headerText: '#FFFFFF',
      desc: '밝고 생기 있는 복숭아빛 피부. 노란 기운의 따뜻한 컬러.',
      colors: ['#F5C87A', '#F0A070', '#E8D060', '#B8D87A', '#F0B8A0'],
      keywords: ['복숭아', '살구', '옐로우', '산호', '아이보리'],
      outfits: [
        { top: { color: '#F0886A', label: '코랄', bold: true }, bottom: { color: '#F5ECD8', label: '아이보리' } },
        { top: { color: '#E8C870', label: '옐로우', bold: true }, bottom: { color: '#D4C8B0', label: '베이지' } },
        { top: { color: '#F0B8A0', label: '살구', bold: true }, bottom: { color: '#ECECEC', label: '라이트 그레이' } },
      ],
    },
    {
      name: 'Summer',
      label: '여름 쿨톤',
      bg: '#F0F4FF',
      headerBg: '#7A9ED4',
      headerText: '#FFFFFF',
      desc: '밝고 부드러운 핑크빛 피부. 파란 기운의 차가운 컬러.',
      colors: ['#A0B8E0', '#C8A8D0', '#80B8C8', '#D0A0B8', '#B0D0C8'],
      keywords: ['라벤더', '로즈', '파우더 블루', '연핑크', '민트'],
      outfits: [
        { top: { color: '#B0A8D0', label: '라벤더', bold: true }, bottom: { color: '#ECEEF5', label: '화이트' } },
        { top: { color: '#80B8C8', label: '파우더 블루', bold: true }, bottom: { color: '#CDD4E0', label: '라이트 그레이' } },
        { top: { color: '#C8A8C8', label: '연핑크', bold: true }, bottom: { color: '#2A2A3A', label: '차콜' } },
      ],
    },
    {
      name: 'Autumn',
      label: '가을 웜톤',
      bg: '#FFF0E0',
      headerBg: '#B06830',
      headerText: '#FFFFFF',
      desc: '황금빛 혹은 올리브 피부. 깊고 풍부한 어스 톤.',
      colors: ['#C87840', '#9A6030', '#D0A050', '#7A9040', '#B06840'],
      keywords: ['테라코타', '카멜', '머스타드', '올리브', '버건디'],
      outfits: [
        { top: { color: '#C06030', label: '테라코타', bold: true }, bottom: { color: '#3A2A1A', label: '다크 브라운' } },
        { top: { color: '#D0A050', label: '머스타드', bold: true }, bottom: { color: '#5A4A38', label: '브라운' } },
        { top: { color: '#7A9040', label: '올리브', bold: true }, bottom: { color: '#EDE0D0', label: '크림' } },
      ],
    },
    {
      name: 'Winter',
      label: '겨울 쿨톤',
      bg: '#F4F0FF',
      headerBg: '#3030A0',
      headerText: '#FFFFFF',
      desc: '차갑고 선명한 피부. 대비가 강한 비비드 컬러.',
      colors: ['#4040A0', '#C02060', '#204080', '#8020A0', '#207060'],
      keywords: ['네이비', '버건디', '로얄 블루', '핫핑크', '블랙'],
      outfits: [
        { top: { color: '#C02060', label: '버건디', bold: true }, bottom: { color: '#1A1A2E', label: '블랙' } },
        { top: { color: '#2040A0', label: '로얄 블루', bold: true }, bottom: { color: '#ECEEF5', label: '화이트' } },
        { top: { color: '#8020A0', label: '바이올렛', bold: true }, bottom: { color: '#2A2A2A', label: '차콜 블랙' } },
      ],
    },
  ];

  return (
    <div className={styles.seasonList}>
      {seasons.map((s) => (
        <div key={s.name} className={styles.seasonCard} style={{ background: s.bg }}>
          {/* 헤더 */}
          <div className={styles.seasonHeader} style={{ background: s.headerBg }}>
            <span className={styles.seasonEn}>{s.name}</span>
            <span className={styles.seasonKo} style={{ color: s.headerText }}>{s.label}</span>
            <p className={styles.seasonDesc}>{s.desc}</p>
          </div>

          {/* 대표 컬러 스와치 */}
          <div className={styles.swatchSection}>
            <span className={styles.swatchLabel}>대표 컬러</span>
            <div className={styles.swatchRow}>
              {s.colors.map((c, i) => (
                <span key={i} className={styles.swatch} style={{ background: c }} title={s.keywords[i]} />
              ))}
            </div>
            <div className={styles.keywordRow}>
              {s.keywords.map((k) => (
                <span key={k} className={styles.keyword}>{k}</span>
              ))}
            </div>
          </div>

          {/* 상하의 추천 */}
          <div className={styles.outfitSection}>
            <span className={styles.swatchLabel}>상하의 추천 조합</span>
            <p className={styles.outfitRule}>얼굴과 가까운 상의에 퍼스널 컬러를 · 하의는 중립으로</p>
            <div className={styles.outfitList}>
              {s.outfits.map((o, i) => (
                <OutfitPair key={i} outfit={o} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PersonalColorGuide() {
  return (
    <article className={styles.article}>
      <p className={styles.lead}>
        같은 옷을 입어도 사람마다 느낌이 달라지는 이유, 바로 <strong>퍼스널 컬러</strong>에 있습니다. 내 피부톤과 어울리는 색을 알면 더 건강하고 생기 있어 보일 수 있어요.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>쿨톤 vs 웜톤</h2>
        <p className={styles.sectionDesc}>
          먼저 내 피부가 쿨톤인지 웜톤인지 파악하는 것이 첫 번째입니다. 손목 안쪽 혈관 색으로 간단히 확인할 수 있어요.
        </p>
        <CoolWarmDiagram />
        <div className={styles.tipBox}>
          <strong>간단 자가진단</strong>
          <ul>
            <li>혈관이 <span className={styles.blue}>파랗거나 보라색</span> → 쿨톤</li>
            <li>혈관이 <span className={styles.green}>초록색</span> → 웜톤</li>
            <li>금 액세서리가 어울리면 웜톤, 은 액세서리가 어울리면 쿨톤</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4계절 퍼스널 컬러 &amp; 상하의 추천</h2>
        <p className={styles.sectionDesc}>
          쿨/웜톤은 밝기와 선명도에 따라 봄·여름·가을·겨울로 나뉩니다. 각 계절별 어울리는 색과 함께, 상의와 하의를 어떻게 조합하면 좋은지 알아보세요.
        </p>
        <SeasonalColorChart />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>우리 옷, 어떤 컬러로 고를까?</h2>
        <p className={styles.sectionDesc}>
          쇼핑할 때 내 퍼스널 컬러를 기준으로 필터링해 보세요. 상품 상세 페이지의 <strong>컬러 태그</strong>를 참고하면 나에게 잘 맞는 색상을 더 빠르게 찾을 수 있습니다.
        </p>
      </section>
    </article>
  );
}
