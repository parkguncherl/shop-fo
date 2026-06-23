import { useEffect, useRef } from 'react';

interface PageViewLogParams {
  pageType: string;
  productId?: number;
  categoryCd?: string;
}

export function usePageViewLog({ pageType, productId, categoryCd }: PageViewLogParams) {
  const startTimeRef = useRef<number>(0); // ← 0으로 초기화
  const scrollMaxRef = useRef<number>(0);
  const sentRef = useRef<boolean>(false);

  // ─── 시작 시간 마운트 시 한 번만 설정 ────────────────
  useEffect(() => {
    startTimeRef.current = Date.now(); // ← useEffect 안에서 설정
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

      const staySeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const isBounce = staySeconds < 3 ? 'Y' : 'N';

      // 이전 페이지 URL에서 상품 ID 추출 (예: /products/all/3 → 3)
      const referrer = document.referrer;
      const refMatch = referrer ? referrer.match(/\/products\/[^/]+\/(\d+)/) : null;
      const befProductId = refMatch ? Number(refMatch[1]) : undefined;

      const data = JSON.stringify({
        pageType,
        pageUrl: referrer || undefined,
        befProductId,
        productId,
        categoryCd,
        staySeconds,
        scrollDepth: scrollMaxRef.current,
        scrollMax: scrollMaxRef.current,
        isBounce,
      });

      navigator.sendBeacon(`${process.env.NEXT_PUBLIC_SHOP_API_ENDPOINT}/frontWeb/log/pageView`, new Blob([data], { type: 'application/json' }));
    };

    window.addEventListener('beforeunload', sendLog);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendLog();
    });

    return () => {
      window.removeEventListener('beforeunload', sendLog);
      sendLog();
    };
  }, [pageType, productId, categoryCd]);
}
