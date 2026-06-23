import { useEffect, useRef } from 'react';

interface PageViewLogParams {
  pageType: string;
  productId?: number;
  categoryCd?: string;
}

// SPA 내 이전 페이지 정보를 모듈 레벨에서 추적
let _prevUrl: string = '';
let _prevProductId: number | undefined;

export function usePageViewLog({ pageType, productId, categoryCd }: PageViewLogParams) {
  const startTimeRef = useRef<number>(0);
  const scrollMaxRef = useRef<number>(0);
  const sentRef = useRef<boolean>(false);

  // 마운트 시점의 이전 페이지 정보 캡처 (이후 변경되기 전에)
  const befUrlRef = useRef<string>(_prevUrl);
  const befProductIdRef = useRef<number | undefined>(_prevProductId);

  // ─── 시작 시간 마운트 시 한 번만 설정 ────────────────
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  // ─── 스크롤 깊이 측정 ─────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      if (scrollDepth > scrollMaxRef.current) {
        scrollMaxRef.current = scrollDepth;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── 페이지 이탈 시 전송 ──────────────────────────
  useEffect(() => {
    const sendLog = () => {
      if (sentRef.current) return;
      sentRef.current = true;

      // 현재 페이지 정보를 다음 페이지를 위해 저장
      _prevUrl = window.location.href;
      _prevProductId = productId;

      const staySeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const isBounce = staySeconds < 3 ? 'Y' : 'N';

      const data = JSON.stringify({
        pageType,
        pageUrl: befUrlRef.current || undefined,
        befProductId: befProductIdRef.current,
        productId,
        categoryCd,
        staySeconds,
        scrollDepth: scrollMaxRef.current,
        scrollMax: scrollMaxRef.current,
        isBounce,
      });

      navigator.sendBeacon(`${process.env.NEXT_PUBLIC_SHOP_API_ENDPOINT}/frontWeb/log/pageView`, new Blob([data], { type: 'application/json' }));
    };

    const onVisibility = () => { if (document.visibilityState === 'hidden') sendLog(); };

    window.addEventListener('beforeunload', sendLog);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('beforeunload', sendLog);
      document.removeEventListener('visibilitychange', onVisibility);
      sendLog();
    };
  }, [pageType, productId, categoryCd]);
}
