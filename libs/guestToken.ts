import { COOKIE_KEYS } from '@/libs/const';

export const initGuestToken = async () => {
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
};
