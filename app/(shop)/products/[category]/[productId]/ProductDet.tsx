'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import publicApi from '@/libs/publicApi';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import styles from './ProductDet.module.scss';
import { usePageViewLog } from '@/hooks/usePageViewLog';

/* ── 타입 ─────────────────────────────────────────────── */
interface ProductDetInfo {
  id: number;
  productDetSeq: number;
  productDetSize?: string;
  productDetColor?: string;
  sysFileNm?: string;
}

interface RelatedProductInfo {
  id: number;
  prodNm?: string;
  sellAmt?: number;
  discountRate?: number;
  sysFileNm?: string;
  src?: string;
}

interface ProductDetail {
  id: number;
  prodNm?: string;
  sellAmt?: number;
  orgAmt?: number;
  discountRate?: number;
  composition?: string;
  repSysFileNm?: string;
  detailSysFileNm?: string;
  sizeSysFileNm?: string;
  etcSysFileNm?: string;
  detList: ProductDetInfo[];
  relatedList: RelatedProductInfo[];
}

/* ── 이미지 헬퍼 ──────────────────────────────────────── */
const ProductImage = ({ src, alt }: { src?: string; alt: string }) => (src ? <img src={src} alt={alt} className={styles.productImg} /> : null);

/* ── 컴포넌트 ─────────────────────────────────────────── */
const ProductDet = ({ productId }: { productId: number }) => {
  usePageViewLog({ pageType: ProductDet.name, productId: productId });
  const getFileUrl = useWebCommonStore((s) => s.getFileUrl);
  const categoryReady = usePartnerCodeStore((s) => s.categoryReady);
  const swipeRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState<{ rep?: string; detail?: string; size?: string; etc?: string }>({});
  const [relatedWithSrc, setRelatedWithSrc] = useState<RelatedProductInfo[]>([]);

  /* ── API 호출 ────────────────────────────────────────── */
  const { data, isSuccess, isLoading } = useQuery({
    queryKey: ['/frontWeb/product/productDetail', productId],
    queryFn: () =>
      publicApi.get('/frontWeb/product/productDetail', {
        params: { productId },
      }),
    enabled: categoryReady && !!productId,
  });

  const product: ProductDetail | null = isSuccess && data?.data?.resultCode === 200 ? data.data.body : null;

  /* ── 이미지 URL 변환 ─────────────────────────────────── */
  useEffect(() => {
    if (!product) return;
    (async () => {
      const [rep, detail, size, etc] = await Promise.all([
        product.repSysFileNm ? getFileUrl(product.repSysFileNm) : undefined,
        product.detailSysFileNm ? getFileUrl(product.detailSysFileNm) : undefined,
        product.sizeSysFileNm ? getFileUrl(product.sizeSysFileNm) : undefined,
        product.etcSysFileNm ? getFileUrl(product.etcSysFileNm) : undefined,
      ]);
      setImages({ rep, detail, size, etc });

      // 연관 상품 이미지
      const related = await Promise.all(
        (product.relatedList ?? []).map(async (r) => ({
          ...r,
          src: r.sysFileNm ? await getFileUrl(r.sysFileNm) : undefined,
        })),
      );
      setRelatedWithSrc(related);
    })();
  }, [product?.id]);

  /* ── 로딩 ────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <div className={`${styles.productImg} ${styles.imgPlaceholder}`} />
        <section className={styles.infoSection}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonPrice} />
        </section>
      </div>
    );
  }

  if (!product) return null;

  const discountedPrice = (product.sellAmt ?? 0) - Math.floor((product.sellAmt ?? 0) * ((product.discountRate ?? 0) / 100));

  return (
    <div className={styles.wrap}>
      {/* ── 상품 이미지 (rep → detail → size → etc 순) ── */}
      <section className={styles.imageSection}>
        <ProductImage src={images.rep} alt={product.prodNm ?? ''} />
        <ProductImage src={images.detail} alt={`${product.prodNm} 상세`} />
        <ProductImage src={images.size} alt={`${product.prodNm} 사이즈`} />
        <ProductImage src={images.etc} alt={`${product.prodNm} 기타`} />
        {/* 이미지가 하나도 없으면 placeholder */}
        {!images.rep && !images.detail && !images.size && !images.etc && <div className={`${styles.productImg} ${styles.imgPlaceholder}`} />}
      </section>

      {/* ── 상품 기본 정보 ─────────────────────────────── */}
      <section className={styles.infoSection}>
        <h1 className={styles.prodNm}>{product.prodNm}</h1>

        <div className={styles.priceRow}>
          {(product.discountRate ?? 0) > 0 && <span className={styles.discount}>{product.discountRate}%</span>}
          <span className={styles.price}>{discountedPrice.toLocaleString()}원</span>
          {(product.discountRate ?? 0) > 0 && product.orgAmt && <span className={styles.orgPrice}>{product.orgAmt.toLocaleString()}원</span>}
        </div>

        {product.composition && <p className={styles.composition}>소재 · {product.composition}</p>}
      </section>

      {/* ── SKU (사이즈 / 컬러) ─────────────────────────── */}
      {(product.detList ?? []).length > 0 && (
        <section className={styles.skuSection}>
          <p className={styles.skuLabel}>옵션 선택</p>
          <div className={styles.skuList}>
            {product.detList.map((det) => (
              <button key={det.id} className={styles.skuChip}>
                {det.productDetColor && <span>{det.productDetColor}</span>}
                {det.productDetSize && <span>{det.productDetSize}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 연관 상품 (2열, 초과 시 스와이프) ─────────────── */}
      {relatedWithSrc.length > 0 && (
        <section className={styles.relatedSection}>
          <p className={styles.relatedLabel}>연관 상품</p>
          <div className={styles.relatedTrack} ref={swipeRef}>
            {relatedWithSrc.map((rel) => {
              const relPrice = (rel.sellAmt ?? 0) - Math.floor((rel.sellAmt ?? 0) * ((rel.discountRate ?? 0) / 100));
              return (
                <Link key={rel.id} href={`/products/all/${rel.id}`} className={styles.relatedCard}>
                  {rel.src ? (
                    <img src={rel.src} alt={rel.prodNm} className={styles.relatedImg} />
                  ) : (
                    <div className={`${styles.relatedImg} ${styles.imgPlaceholder}`} />
                  )}
                  <p className={styles.relatedNm}>{rel.prodNm}</p>
                  <div className={styles.relatedPrice}>
                    {(rel.discountRate ?? 0) > 0 && <span className={styles.discount}>{rel.discountRate}%</span>}
                    <span>{relPrice.toLocaleString()}원</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 하단 버튼 ─────────────────────────────────── */}
      <div className={styles.bottomBar}>
        <button className={styles.cartBtn} aria-label="장바구니 담기">
          장바구니
        </button>
        <button className={styles.orderBtn} aria-label="바로 주문하기">
          주문하기
        </button>
      </div>
    </div>
  );
};

export default ProductDet;
