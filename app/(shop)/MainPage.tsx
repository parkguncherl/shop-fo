'use client';

import styles from './MainPage.module.scss';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import publicApi from '@/libs/publicApi';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import { ProductResponseProductInfo } from '@/generated';
import { FileDet } from '@/generated';
import { usePageViewLog } from '@/hooks/usePageViewLog';

interface ProductWithSrc extends ProductResponseProductInfo {
  src?: string;
  heroImages?: string[];
}

const calcFinalPrice = (sellAmt?: number | null, discountRate?: number | null) => {
  if (!sellAmt) return 0;
  return sellAmt - Math.floor(sellAmt * ((discountRate || 0) / 100));
};

// ─── 히어로 이미지 셀 (이미지 없으면 임시 플레이스홀더) ─────────
const HeroCell = ({ src, alt, className }: { src?: string; alt: string; className: string }) => (
  <div className={className}>
    {src ? (
      <img src={src} alt={alt} draggable={false} />
    ) : (
      <div className={styles.heroPlaceholder}>
        <span>MAPSIGGUN</span>
      </div>
    )}
  </div>
);

// ─── 히어로 모자이크 (대표상품 이미지 3장: 큰 이미지 + 우측 2장) ──
const HeroMosaic = ({ product }: { product: ProductWithSrc }) => {
  const router = useRouter();
  // 대표상품 이미지 3장 확보 (부족하면 undefined 로 채워 임시 이미지 노출)
  const base = product.heroImages ?? (product.src ? [product.src] : []);
  const imgs: (string | undefined)[] = [base[0], base[1], base[2]];

  return (
    <div className={styles.hero}>
      <div className={styles.heroMosaic}>
        <div
          className={styles.heroMosaicMain}
          onClick={() => router.push(`/products/all/${product.id}`)}
          role="button"
        >
          <HeroCell src={imgs[0]} alt={product.prodNm ?? ''} className={styles.heroImgWrap} />
        </div>

        <HeroCell src={imgs[1]} alt={product.prodNm ?? ''} className={styles.heroMosaicSide} />
        <HeroCell src={imgs[2]} alt={product.prodNm ?? ''} className={styles.heroMosaicSide} />
      </div>
    </div>
  );
};

// ─── 상품 카드 ────────────────────────────────────────────
const ProductCard = ({ product }: { product: ProductWithSrc }) => {
  const finalPrice = calcFinalPrice(product.sellAmt as unknown as number, product.discountRate as unknown as number);
  const colorsStr = (product as any).stndrColors as string | undefined;
  const hexes = colorsStr ? colorsStr.split(',').filter(Boolean) : [];

  return (
    <Link href={`/products/all/${product.id}`} className={styles.card}>
      <div className={styles.cardImageWrap}>
        {product.src ? (
          <img src={product.src} alt={product.prodNm ?? ''} className={styles.cardImage} />
        ) : (
          <div className={`${styles.cardImage} ${styles.defaultImg}`} />
        )}
      </div>
      {hexes.length > 0 && (
        <div className={styles.colorBars}>
          {hexes.slice(0, 6).map((h, i) => (
            <span key={i} title={`#${h}`} className={styles.colorBar} style={{ background: `#${h}` }} />
          ))}
        </div>
      )}
      <div className={styles.cardInfo}>
        <p className={styles.cardName}>{product.prodNm}</p>
        <div className={styles.cardPriceRow}>
          {(product.discountRate ?? 0) > 0 && (
            <span className={styles.cardDiscount}>{Math.round(product.discountRate ?? 0)}%</span>
          )}
          <span className={styles.cardPrice}>{finalPrice.toLocaleString()}원</span>
          {(product.discountRate ?? 0) > 0 && (
            <span className={styles.cardOriginalPrice}>
              {(product.sellAmt as unknown as number)?.toLocaleString()}원
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

// ─── 3초마다 2장씩 스냅 · 드래그 가능 캐러셀 ────────────────
const CardCarousel = ({ children }: { children: React.ReactNode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedUntil = useRef(0);
  const pointerDown = useRef(false);
  const moved = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const DRAG_THRESHOLD = 6;

  // 카드 2장 너비(카드 width + margin-right) * 2
  const getStepWidth = () => {
    const el = scrollRef.current;
    if (!el) return 344;
    const card = el.querySelector('a') as HTMLElement | null;
    if (!card) return 344;
    const mr = parseFloat(getComputedStyle(card).marginRight || '12');
    return (card.offsetWidth + mr) * 2;
  };

  // 무한 루프: scrollLeft 가 절반 이상이면 첫 복사본으로 순간이동
  const loopCheck = () => {
    const el = scrollRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    else if (el.scrollLeft < 0) el.scrollLeft += half;
  };

  const advance = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollLeft + getStepWidth(), behavior: 'smooth' });
    setTimeout(loopCheck, 450);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (Date.now() < pausedUntil.current || pointerDown.current) return;
      advance();
    }, 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    pointerDown.current = true;
    moved.current = false;
    dragStartX.current = e.clientX;
    dragStartScroll.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!pointerDown.current || !el) return;
    const dx = e.clientX - dragStartX.current;
    if (!moved.current) {
      if (Math.abs(dx) <= DRAG_THRESHOLD) return;
      moved.current = true;
      try { el.setPointerCapture(e.pointerId); } catch {}
    }
    el.scrollLeft = dragStartScroll.current - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!pointerDown.current) return;
    pointerDown.current = false;
    const el = scrollRef.current;
    if (moved.current && el) {
      // 가장 가까운 2장 경계로 스냅
      const step = getStepWidth();
      el.scrollTo({ left: Math.round(el.scrollLeft / step) * step, behavior: 'smooth' });
      setTimeout(loopCheck, 450);
      pausedUntil.current = Date.now() + 5000;
      try { el.releasePointerCapture(e.pointerId); } catch {}
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  };

  return (
    <div
      ref={scrollRef}
      className={styles.marquee}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className={styles.marqueeTrack}>{children}</div>
    </div>
  );
};

// (히어로: 카테고리 10000 첫 상품 3분할 · 하단: 나머지 그리드)
const MainPage = () => {
  usePageViewLog({ pageType: 'Main', categoryCd: 'all' });
  const getFileUrl = useWebCommonStore((s) => s.getFileUrl);
  const selectFileList = useWebCommonStore((s) => s.selectFileList);
  const categoryReady = usePartnerCodeStore((s) => s.categoryReady);

  const [products, setProducts] = useState<ProductWithSrc[]>([]);
  const [hero, setHero] = useState<ProductWithSrc | undefined>(undefined);

  // 카테고리 10000 상품 목록 (히어로 + 하단 그리드 공용, 한 번만 조회 · 카테고리 필수 엔드포인트)
  const { data, isSuccess } = useQuery({
    queryKey: ['/frontWeb/product/productInfoListByCategory', 'main'],
    queryFn: () =>
      publicApi.get('/frontWeb/product/productInfoListByCategory', {
        params: { pageRowCount: 40, categoryId: '10000' },
      }),
    enabled: categoryReady,
  });

  useEffect(() => {
    if (!isSuccess) return;
    const { resultCode, body } = data.data;
    if (resultCode !== 200) return;

    const rows: ProductResponseProductInfo[] = body.rows ?? [];

    (async () => {
      const withSrc: ProductWithSrc[] = await Promise.all(
        rows.map(async (p) => {
          const src = p.sysFileNm ? await getFileUrl(p.sysFileNm as string) : undefined;
          return { ...p, src };
        })
      );

      // 가장 처음 상품 → 히어로(3분할), 이미지 3장은 repFileId 로 로드
      const [first, ...restRows] = withSrc;
      if (first) {
        let heroImages: string[] = [];
        if (first.repFileId) {
          const fileDets: FileDet[] = await selectFileList(first.repFileId as unknown as number);
          heroImages = (
            await Promise.all(fileDets.map((f) => (f.sysFileNm ? getFileUrl(f.sysFileNm) : Promise.resolve(''))))
          ).filter(Boolean);
        }
        setHero({ ...first, heroImages });
      } else {
        setHero(undefined);
      }

      // 그 다음 상품들 → 하단 그리드
      setProducts(restRows);
    })();
  }, [isSuccess, data]);

  return (
    <>
      {hero && <HeroMosaic product={hero} />}

      {products.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionTitle}>NEW ARRIVALS</p>
          <CardCarousel>
            {/* 무한 루프를 위해 목록 2번 반복 */}
            {[...products, ...products].map((p, i) => (
              <ProductCard key={`${p.id}-${i}`} product={p} />
            ))}
          </CardCarousel>
        </section>
      )}
    </>
  );
};

export default MainPage;
