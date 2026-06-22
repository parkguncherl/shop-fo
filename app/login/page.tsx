'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import styles from './page.module.scss';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getCallbackUrl = () =>
    new URLSearchParams(window.location.search).get('callbackUrl') || '/';

  const handleKakaoLogin = () => {
    signIn('kakao', { callbackUrl: getCallbackUrl() });
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl: getCallbackUrl(),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } else if (result?.url) {
      window.location.href = result.url;
    }
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

        <div className={styles.divider}>또는</div>

        <form className={styles.form} onSubmit={handleCredentialsLogin}>
          <input
            className={styles.input}
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className={styles.errorMsg}>{error}</p>}
          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
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
