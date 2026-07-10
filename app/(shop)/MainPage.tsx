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

// ─── 히어로 슬라이더 ──────────────────────────────────────
const HeroSlider = ({ product }: { product: ProductWithSrc }) => {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const images = product.heroImages ?? (product.src ? [product.src] : []);
  const startX = useRef(0);
  const dragging = useRef(false);

  const goTo = (i: number) => setIdx((i + images.length) % images.length);

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    dragging.current = false;
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (Math.abs(e.clientX - startX.current) > 8) dragging.current = true;
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 40) {
      goTo(dx < 0 ? idx + 1 : idx - 1);
    } else if (!dragging.current) {
      router.push(`/products/all/${product.id}`);
    }
  };

  if (images.length === 0) return null;

  return (
    <div
      className={styles.hero}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className={styles.heroTrack}
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {images.map((src, i) => (
          <div key={i} className={styles.heroSlide}>
            <img src={src} alt={product.prodNm ?? ''} draggable={false} />
          </div>
        ))}
      </div>

      {/* 가격/이름 오버레이 */}
      <div className={styles.heroInfo}>
        <p className={styles.heroName}>{product.prodNm}</p>
        <div className={styles.heroPriceRow}>
          {(product.discountRate ?? 0) > 0 && (
            <span className={styles.heroDiscount}>{Math.round(product.discountRate ?? 0)}%</span>
          )}
          <span className={styles.heroPrice}>
            {calcFinalPrice(product.sellAmt as unknown as number, product.discountRate as unknown as number).toLocaleString()}원
          </span>
          {(product.discountRate ?? 0) > 0 && (
            <span className={styles.heroOriginalPrice}>
              {(product.sellAmt as unknown as number)?.toLocaleString()}원
            </span>
          )}
        </div>
      </div>

      {/* 인디케이터 */}
      {images.length > 1 && (
        <div className={styles.heroDots}>
          {images.map((_, i) => (
            <span
              key={i}
              className={`${styles.heroDot}${i === idx ? ` ${styles.active}` : ''}`}
            />
          ))}
        </div>
      )}
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
        {hexes.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {hexes.slice(0, 6).map((h, i) => (
              <span
                key={i}
                title={`#${h}`}
                style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: `#${h}`, display: 'inline-block',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

// ─── 메인 페이지 ──────────────────────────────────────────
const MainPage = () => {
  usePageViewLog({ pageType: 'Main', categoryCd: 'all' });
  const getFileUrl = useWebCommonStore((s) => s.getFileUrl);
  const selectFileList = useWebCommonStore((s) => s.selectFileList);
  const categoryReady = usePartnerCodeStore((s) => s.categoryReady);

  const [products, setProducts] = useState<ProductWithSrc[]>([]);

  const { data, isSuccess } = useQuery({
    queryKey: ['/frontWeb/product/productInfoListPaging', 'main'],
    queryFn: () =>
      publicApi.get('/frontWeb/product/productInfoListPaging', {
        params: { pageRowCount: 40, categoryId: 'all' },
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

      // 첫 번째 상품은 repFileId로 다중 이미지 가져오기
      if (withSrc.length > 0 && withSrc[0].repFileId) {
        const fileDets: FileDet[] = await selectFileList(withSrc[0].repFileId as unknown as number);
        const heroImages = await Promise.all(
          fileDets.map((f) => (f.sysFileNm ? getFileUrl(f.sysFileNm) : Promise.resolve('')))
        );
        withSrc[0] = { ...withSrc[0], heroImages: heroImages.filter(Boolean) };
      }

      setProducts(withSrc);
    })();
  }, [isSuccess, data]);

  const hero = products[0];
  const rest = products.slice(1);

  return (
    <>
      {hero && <HeroSlider product={hero} />}

      {rest.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionTitle}>NEW ARRIVALS</p>
          <div className={styles.grid}>
            {rest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default MainPage;
