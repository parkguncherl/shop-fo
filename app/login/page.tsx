'use client';
import React from 'react';
import { signIn } from 'next-auth/react';
import styles from './page.module.scss';

export default function LoginPage() {
  const handleSocial = (provider: 'kakao' | 'naver' | 'google') => {
    signIn(provider, { callbackUrl: '/' });
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.desc}>소셜 계정으로 간편하게 시작하세요</p>

        <div className={styles.socialBtns}>
          {/* 카카오 */}
          <button
            className={`${styles.socialBtn} ${styles.kakao}`}
            onClick={() => handleSocial('kakao')}
            type="button"
          >
            <KakaoIcon />
            카카오로 로그인
          </button>

          {/* 네이버 */}
          <button
            className={`${styles.socialBtn} ${styles.naver}`}
            onClick={() => handleSocial('naver')}
            type="button"
          >
            <NaverIcon />
            네이버로 로그인
          </button>

          {/* 구글 */}
          <button
            className={`${styles.socialBtn} ${styles.google}`}
            onClick={() => handleSocial('google')}
            type="button"
          >
            <GoogleIcon />
            구글로 로그인
          </button>
        </div>
      </div>
    </main>
  );
}

// ── 소셜 아이콘 SVG ──────────────────────────────────────────────

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2C5.58 2 2 4.91 2 8.5c0 2.33 1.47 4.37 3.67 5.6l-.94 3.47 4.08-2.67c.39.05.79.1 1.19.1 4.42 0 8-2.91 8-6.5S14.42 2 10 2z"
        fill="currentColor"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M11.5 10.3L8 5H5v10h3.5V9.7L12 15h3V5h-3.5v5.3z" fill="currentColor"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M19.6 10.23c0-.71-.06-1.39-.18-2.05H10v3.87h5.38a4.6 4.6 0 01-2 3.02v2.51h3.23c1.89-1.74 2.99-4.31 2.99-7.35z" fill="#4285F4"/>
      <path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.23-2.51c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H1.07v2.6A9.997 9.997 0 0010 20z" fill="#34A853"/>
      <path d="M4.4 11.89A5.98 5.98 0 014.09 10c0-.66.11-1.3.31-1.89V5.51H1.07A10.01 10.01 0 000 10c0 1.61.39 3.14 1.07 4.49l3.33-2.6z" fill="#FBBC05"/>
      <path d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.95.99 12.7 0 10 0A10 10 0 001.07 5.51l3.33 2.6C5.19 5.74 7.4 3.98 10 3.98z" fill="#EA4335"/>
    </svg>
  );
}
