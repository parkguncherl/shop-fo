'use client';

import styles from './MainPage.module.scss';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import publicApi from '@/libs/publicApi';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import { ProductResponseProductInfo } from '@/generated';
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

// ─── 히어로 모자이크 (상품 3개: 큰 이미지 + 우측 2장, 각각 상세 이동) ──
const HeroMosaic = ({ heroes }: { heroes: ProductWithSrc[] }) => {
  const [main, side1, side2] = heroes;

  return (
    <div className={styles.hero}>
      <div className={styles.heroMosaic}>
        <Link href={`/products/all/${main?.id}`} className={styles.heroMosaicMain}>
          <HeroCell src={main?.src} alt={main?.prodNm ?? ''} className={styles.heroImgWrap} />
        </Link>

        <Link href={`/products/all/${side1?.id}`} className={styles.heroMosaicSide}>
          <HeroCell src={side1?.src} alt={side1?.prodNm ?? ''} className={styles.heroImgWrap} />
        </Link>
        <Link href={`/products/all/${side2?.id}`} className={styles.heroMosaicSide}>
          <HeroCell src={side2?.src} alt={side2?.prodNm ?? ''} className={styles.heroImgWrap} />
        </Link>
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
      <div className={styles.colorBars}>
        {hexes.slice(0, 6).map((h, i) => (
          <span key={i} title={`#${h}`} className={styles.colorBar} style={{ background: `#${h}` }} />
        ))}
      </div>
      <div className={styles.cardInfo}>
        <p className={styles.cardName}>{product.prodNm}</p>
        <div className={styles.cardPriceRow}>
          {(product.discountRate ?? 0) > 0 && <span className={styles.cardDiscount}>{Math.round(product.discountRate ?? 0)}%</span>}
          <span className={styles.cardPrice}>{finalPrice.toLocaleString()}원</span>
          {(product.discountRate ?? 0) > 0 && <span className={styles.cardOriginalPrice}>{(product.sellAmt as unknown as number)?.toLocaleString()}원</span>}
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

  const getCardWidth = () => {
    const el = scrollRef.current;
    if (!el) return 320;
    const card = el.querySelector('a') as HTMLElement | null;
    return card ? card.offsetWidth : 320;
  };

  const advance = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = getCardWidth();
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxScroll - cardWidth / 2) {
      // 끝 도달 → 처음으로 부드럽게 복귀
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollTo({ left: el.scrollLeft + cardWidth, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (Date.now() < pausedUntil.current || pointerDown.current) return;
      advance();
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
    }
    el.scrollLeft = dragStartScroll.current - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!pointerDown.current) return;
    pointerDown.current = false;
    const el = scrollRef.current;
    if (moved.current && el) {
      const step = getCardWidth();
      el.scrollTo({ left: Math.round(el.scrollLeft / step) * step, behavior: 'smooth' });
      pausedUntil.current = Date.now() + 5000;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
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

// ─── 카테고리별 상품 섹션 (최대 4개) ────────────────────────
const CategorySection = ({ categoryNm, categoryId, items }: { categoryNm: string; categoryId: string; items: ProductWithSrc[] }) => (
  <section className={styles.categorySection}>
    <Link href={`/products/${categoryId}`} className={styles.sectionTitleLink}>
      <p className={styles.sectionTitle}>
        {categoryNm} <span className={styles.sectionTitleArrow}>›</span>
      </p>
    </Link>
    <div className={styles.categoryGrid}>
      {items.slice(0, 4).map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  </section>
);

// (히어로: 카테고리 10000 첫 상품 3분할 · 하단: 나머지 그리드)
const MainPage = () => {
  usePageViewLog({ pageType: 'Main', categoryCd: 'all' });
  const getFileUrl = useWebCommonStore((s) => s.getFileUrl);
  const categoryReady = usePartnerCodeStore((s) => s.categoryReady);

  const [products, setProducts] = useState<ProductWithSrc[]>([]);
  const [heroes, setHeroes] = useState<ProductWithSrc[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<{ categoryNm: string; categoryId: string; items: ProductWithSrc[] }[]>([]);

  // 카테고리 10000 상품 목록 (히어로 + 캐러셀)
  const { data, isSuccess } = useQuery({
    queryKey: ['/frontWeb/product/productInfoListByCategory', 'main'],
    queryFn: () =>
      publicApi.get('/frontWeb/product/productInfoListByCategory', {
        params: { pageRowCount: 40, categoryId: '10000' },
      }),
    enabled: categoryReady,
  });

  // 메인 하단 카테고리별 상품 목록
  const { data: mainListData, isSuccess: mainListSuccess } = useQuery({
    queryKey: ['/frontWeb/product/selectProductListForMain'],
    queryFn: () => publicApi.get('/frontWeb/product/selectProductListForMain'),
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
        }),
      );

      const shuffled = [...withSrc].sort(() => Math.random() - 0.5);
      setHeroes(shuffled.slice(0, 3));
      setProducts(shuffled.slice(3));
    })();
  }, [isSuccess, data]);

  useEffect(() => {
    if (!mainListSuccess) return;
    const { resultCode, body } = mainListData.data;
    if (resultCode !== 200) return;

    const rows: ProductResponseProductInfo[] = body ?? [];

    (async () => {
      const withSrc: ProductWithSrc[] = await Promise.all(
        rows.map(async (p) => {
          const src = p.sysFileNm ? await getFileUrl(p.sysFileNm as string) : undefined;
          return { ...p, src };
        }),
      );

      // categoryNm 기준으로 그룹핑 (쿼리 ORDER BY 순서 유지)
      const groupMap = new Map<string, { categoryId: string; items: ProductWithSrc[] }>();
      withSrc.forEach((p) => {
        const key = (p as any).categoryNm ?? '기타';
        if (!groupMap.has(key)) groupMap.set(key, { categoryId: String((p as any).categoryId ?? ''), items: [] });
        groupMap.get(key)!.items.push(p);
      });

      setCategoryGroups(Array.from(groupMap.entries()).map(([categoryNm, { categoryId, items }]) => ({ categoryNm, categoryId, items })));
    })();
  }, [mainListSuccess, mainListData]);

  return (
    <>
      {heroes.length > 0 && <HeroMosaic heroes={heroes} />}

      {products.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionTitle}>NEW ARRIVALS</p>
          <CardCarousel>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </CardCarousel>
        </section>
      )}

      {categoryGroups.length > 0 && (
        <div className={styles.categorySections}>
          {categoryGroups.map((g) => (
            <CategorySection key={g.categoryNm} categoryNm={g.categoryNm} categoryId={g.categoryId} items={g.items} />
          ))}
        </div>
      )}
    </>
  );
};

export default MainPage;
