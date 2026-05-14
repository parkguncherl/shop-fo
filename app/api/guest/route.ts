import { COOKIE_KEYS } from '@/libs/const';

export const initGuestToken = async () => {
  try {
    const res = await fetch('/api/guest', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('Guest Token 발급 실패');
      return;
    }

    const data = await res.json();
    console.log('Guest Token 응답 ===>', data);
  } catch (e) {
    console.error('Guest Token 발급 실패', e);
  }
};
