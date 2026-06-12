'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import publicApi from '@/libs/publicApi';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import { useAddCartItem, useCartQuery } from '@/hooks/useCart';
import { toastSuccess, toastError } from '@/components/common/Others/ToastMessage';
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
  const { mutateAsync: addCartItem, isPending: isAdding } = useAddCartItem();
  const { data: cartData } = useCartQuery();
  const swipeRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState<{ rep?: string; detail?: string; size?: string; etc?: string }>({});
  const [relatedWithSrc, setRelatedWithSrc] = useState<RelatedProductInfo[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  /* ── API 호출 ─────────────────────────────────────────── */
  const { data, isSuccess, isLoading } = useQuery({
    queryKey: ['/frontWeb/product/productDetail', productId],
    queryFn: () => publicApi.get('/frontWeb/product/productDetail', { params: { productId } }),
    enabled: categoryReady && !!productId,
  });

  const product: ProductDetail | null = isSuccess && data?.data?.resultCode === 200 ? data.data.body : null;

  /* ── 색상 / 사이즈 목록 파생 ─────────────────────────── */
  const colors = useMemo(() => {
    if (!product) return [];
    return [...new Set((product.detList ?? []).map((d) => d.productDetColor).filter(Boolean))] as string[];
  }, [product]);

  const sizes = useMemo(() => {
    if (!product) return [];
    // 색상 선택 후 → 해당 색상에서 가능한 사이즈만
    const filtered = selectedColor ? (product.detList ?? []).filter((d) => d.productDetColor === selectedColor) : product.detList ?? [];
    return [...new Set(filtered.map((d) => d.productDetSize).filter(Boolean))] as string[];
  }, [product, selectedColor]);

  // 색상+사이즈로 매칭되는 det 찾기 → productDetId
  const matchedDet: ProductDetInfo | null = useMemo(() => {
    if (!product) return null;
    // 옵션 없는 상품
    if ((product.detList ?? []).length === 0) return null;
    // 색상만 있는 경우
    if (colors.length > 0 && sizes.length === 0 && selectedColor) {
      return product.detList.find((d) => d.productDetColor === selectedColor) ?? null;
    }
    // 사이즈만 있는 경우
    if (colors.length === 0 && sizes.length > 0 && selectedSize) {
      return product.detList.find((d) => d.productDetSize === selectedSize) ?? null;
    }
    // 색상 + 사이즈 모두 있는 경우
    if (selectedColor && selectedSize) {
      return product.detList.find((d) => d.productDetColor === selectedColor && d.productDetSize === selectedSize) ?? null;
    }
    return null;
  }, [product, colors, sizes, selectedColor, selectedSize]);

  /* ── 색상/사이즈 1개뿐이면 자동 선택 ───────────────── */
  useEffect(() => {
    if (!product) return;
    if (colors.length === 1) setSelectedColor(colors[0]);
  }, [product?.id, colors.length]);

  useEffect(() => {
    if (!product) return;
    if (sizes.length === 1) setSelectedSize(sizes[0]);
  }, [product?.id, sizes.length, selectedColor]);

  /* ── 색상 선택 시 사이즈 초기화 ─────────────────────── */
  const handleColorSelect = (color: string) => {
    setSelectedColor((prev) => (prev === color ? null : color));
    setSelectedSize(null);
  };

  /* ── 이미지 URL 변환 ──────────────────────────────────── */
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

      const related = await Promise.all(
        (product.relatedList ?? []).map(async (r) => ({
          ...r,
          src: r.sysFileNm ? await getFileUrl(r.sysFileNm) : undefined,
        })),
      );
      setRelatedWithSrc(related);
    })();
  }, [product?.id]);

  /* ── 장바구니 담기 ─────────────────────────────────────── */
  const handleAddToCart = async () => {
    if (!product) return;

    const hasDet = (product.detList ?? []).length > 0;

    // 옵션 있는 상품 → 색상/사이즈 선택 확인
    if (hasDet) {
      if (colors.length > 0 && !selectedColor) {
        toastError('색상을 선택해주세요.');
        return;
      }
      if (sizes.length > 0 && !selectedSize) {
        toastError('사이즈를 선택해주세요.');
        return;
      }
      if (!matchedDet) {
        toastError('선택한 옵션을 찾을 수 없습니다.');
        return;
      }
    }

    // 옵션 없는 상품 → det 첫 번째 항목 사용 (없으면 productId 로 대체)
    const productDetId = matchedDet?.id ?? product.detList?.[0]?.id ?? product.id;

    // 이미 담긴 옵션인지 확인
    const alreadyInCart = cartData?.items.some((i) => i.productDetId === productDetId);
    if (alreadyInCart) {
      toastError('이미 장바구니에 담긴 상품입니다.');
      return;
    }

    const discountedPrice = (product.sellAmt ?? 0) - Math.floor((product.sellAmt ?? 0) * ((product.discountRate ?? 0) / 100));

    try {
      await addCartItem({
        productDetId,
        quantity: 1,
        unitPrice: discountedPrice,
        optionsSnapshot: selectedColor || selectedSize ? JSON.stringify({ color: selectedColor, size: selectedSize }) : undefined,
      });
      toastSuccess('장바구니에 담았습니다 🛒');
    } catch {
      toastError('장바구니 담기에 실패했습니다.');
    }
  };

  /* ── 로딩 ──────────────────────────────────────────────── */
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

  const hasDet = (product.detList ?? []).length > 0;
  const hasColor = colors.length > 0;
  const hasSize = sizes.length > 0;

  return (
    <div className={styles.wrap}>
      {/* ── 상품 이미지 ── */}
      <section className={styles.imageSection}>
        <ProductImage src={images.rep} alt={product.prodNm ?? ''} />
        <ProductImage src={images.detail} alt={`${product.prodNm} 상세`} />
        <ProductImage src={images.size} alt={`${product.prodNm} 사이즈`} />
        <ProductImage src={images.etc} alt={`${product.prodNm} 기타`} />
        {!images.rep && !images.detail && !images.size && !images.etc && <div className={`${styles.productImg} ${styles.imgPlaceholder}`} />}
      </section>

      {/* ── 상품 기본 정보 ── */}
      <section className={styles.infoSection}>
        <h1 className={styles.prodNm}>{product.prodNm}</h1>
        <div className={styles.priceRow}>
          {(product.discountRate ?? 0) > 0 && <span className={styles.discount}>{product.discountRate}%</span>}
          <span className={styles.price}>{discountedPrice.toLocaleString()}원</span>
          {(product.discountRate ?? 0) > 0 && product.orgAmt && <span className={styles.orgPrice}>{product.orgAmt.toLocaleString()}원</span>}
        </div>
        {product.composition && <p className={styles.composition}>소재 · {product.composition}</p>}
      </section>

      {/* ── 옵션 선택 (색상 → 사이즈 2단계) ── */}
      {hasDet && (
        <section className={styles.skuSection}>
          {/* 색상 선택 */}
          {hasColor && (
            <>
              <p className={styles.skuLabel}>
                색상
                {selectedColor && <span className={styles.skuSelected}> · {selectedColor}</span>}
              </p>
              <div className={styles.skuList}>
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`${styles.skuChip} ${selectedColor === color ? styles.skuChipSelected : ''}`}
                    onClick={() => handleColorSelect(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 사이즈 선택 — 색상 선택 후 표시 (색상 없으면 바로 표시) */}
          {hasSize && (!hasColor || selectedColor) && (
            <div className={styles.skuSizeWrap}>
              <p className={styles.skuLabel}>
                사이즈
                {selectedSize && <span className={styles.skuSelected}> · {selectedSize}</span>}
              </p>
              <div className={styles.skuList}>
                {sizes.map((size) => (
                  <button
                    key={size}
                    className={`${styles.skuChip} ${selectedSize === size ? styles.skuChipSelected : ''}`}
                    onClick={() => setSelectedSize((prev) => (prev === size ? null : size))}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 연관 상품 ── */}
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

      {/* ── 하단 버튼 ── */}
      <div className={styles.bottomBar}>
        <button className={styles.cartBtn} onClick={handleAddToCart} disabled={isAdding} aria-label="장바구니 담기">
          {isAdding ? '담는 중...' : '장바구니에 담기'}
        </button>
      </div>
    </div>
  );
};

export default ProductDet;
