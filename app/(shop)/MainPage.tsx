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

// ─── 메인 페이지 ──────────────────────────────────────────
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
          <div className={styles.marquee}>
            {/* 이음새 없는 자동 흐름을 위해 목록을 2번 반복 */}
            <div className={styles.marqueeTrack}>
              {[...products, ...products].map((p, i) => (
                <ProductCard key={`${p.id}-${i}`} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default MainPage;
