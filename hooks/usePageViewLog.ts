import { useEffect, useRef } from 'react';

interface PageViewLogParams {
  pageType: string;
  productId?: number;
  categoryCd?: string;
}

export function usePageViewLog({ pageType, productId, categoryCd }: PageViewLogParams) {
  const startTimeRef = useRef<number>(0);
  const scrollMaxRef = useRef<number>(0);
  const sentRef = useRef<boolean>(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

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

  useEffect(() => {
    const sendLog = () => {
      if (sentRef.current) return;
      sentRef.current = true;

      const staySeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const isBounce = staySeconds < 3 ? 'Y' : 'N';

      const data = JSON.stringify({
        pageType,
        pageUrl: window.location.href,
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
