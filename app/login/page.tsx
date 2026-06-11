'use client';
import React from 'react';
import { signIn } from 'next-auth/react';
import styles from './page.module.scss';

export default function LoginPage() {
  const handleKakaoLogin = () => {
    signIn('kakao', { callbackUrl: '/' });
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.desc}>카카오 계정으로 간편하게 시작하세요.</p>

        <div className={styles.socialBtns}>
          <button
            className={`${styles.socialBtn} ${styles.kakao}`}
            onClick={handleKakaoLogin}
            type="button"
          >
            <KakaoIcon />
            카카오로 로그인
          </button>
        </div>
      </div>
    </main>
  );
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2C5.58 2 2 4.91 2 8.5c0 2.33 1.47 4.37 3.67 5.6l-.94 3.47 4.08-2.67c.39.05.79.1 1.19.1 4.42 0 8-2.91 8-6.5S14.42 2 10 2z"
        fill="currentColor"
      />
    </svg>
  );
}