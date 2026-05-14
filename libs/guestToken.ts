import { COOKIE_KEYS } from '@/libs/const';
import { getCookie, setCookie } from 'cookies-next';
import { publicApi } from '@/libs/api';

export const initGuestToken = async () => {
  const guestToken = getCookie(COOKIE_KEYS.GUEST_TOKEN);
  if (!guestToken) {
    try {
      const res = await fetch('/api/guest', {
        method: 'POST',
        credentials: 'include', // 쿠키 포함
      });

      if (!res.ok) {
        console.error('Guest Token 발급 실패');
        return;
      }

      const data = await res.json();
      setCookie(COOKIE_KEYS.GUEST_TOKEN, data.body.guestToken, {
        maxAge: 60 * 60 * 24 * 30,
        secure: process.env.NEXT_PUBLIC_APP_ENV === 'production', // ← 로컬에서는 false
        sameSite: 'strict',
      });
    } catch (e) {
      console.error('Guest Token 발급 실패', e);
    }
  }
};
