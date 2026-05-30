import { COOKIE_KEYS } from '@/libs/const';

let initPromise: Promise<void> | null = null; // ← Promise 캐싱

export const initGuestToken = async (): Promise<void> => {
  // ✅ 이미 쿠키가 있으면 발급 스킵
  const hasGuestToken = document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE_KEYS.GUEST_TOKEN}=`));
  if (hasGuestToken) return;

  // 이미 실행 중이면 같은 Promise 반환 (중복 실행 방지)
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch('/api/guest', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refererUrl: document.referrer, // ← 이전 URL
          currentUrl: window.location.href, // ← 현재 URL
          utmSource: new URLSearchParams(window.location.search).get('utm_source') ?? '',
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium') ?? '',
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') ?? '',
          utmContent: new URLSearchParams(window.location.search).get('utm_content') ?? '',
          fbclid: new URLSearchParams(window.location.search).get('fbclid') ?? '',
        }),
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
  })();

  return initPromise;
};
