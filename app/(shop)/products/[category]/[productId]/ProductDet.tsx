'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import publicApi from '@/libs/publicApi';
import { authApi } from '@/libs/api';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import { useAddCartItem, useCartQuery } from '@/hooks/useCart';
import { toastSuccess, toastError } from '@/components/common/Others/ToastMessage';
import ReviewSection from './ReviewSection';
import ProductAiChat from './ProductAiChat';
import styles from './ProductDet.module.scss';
import { usePageViewLog } from '@/hooks/usePageViewLog';
import { ProductResponseProductDetail, ProductResponseProductDetInfo, ProductResponseRelatedProductInfo } from '@/generated';

interface RelatedProductWithSrc extends ProductResponseRelatedProductInfo {
  src?: string;
}

const NOTICES = [
  '원단, 측정 방법 및 위치에 따라 오차가 있을 수 있습니다.',
  '원단 특성에 따라 축률 등으로 인한 1-3cm 오차는 불량 범주에 해당되지 않습니다.',
  '니트의 경우 5cm 내외로 차이가 큰 편이니, 참고 부탁드립니다.',
  '상품 색상은 디테일 컷을 참고해 주세요.',
  '택이나 라벨, 여유단추의 경우 소재 및 디자인에 따라 부착여부와 상태가 달라질 수 있습니다.',
  '모든 의류의 첫 세탁은 드라이클리닝을 권장합니다.',
  '어두운 색상은 이염 방지를 위해 밝은 색상과의 착용을 피해주세요.',
  '건조기 사용은 수축, 변형, 변색 위험이 있을 수 있으니, 사용을 삼가해 주세요.',
  '명시된 세탁 방법 외의 세탁으로 인한 변형, 손상에는 보상 책임을 지지 않습니다.',
];

/* ── 이미지 헬퍼 ──────────────────────────────────────── */
const ProductImage = ({ src, alt }: { src?: string; alt: string }) => (src ? <img src={src} alt={alt} className={styles.productImg} /> : null);

/* ── 컴포넌트 ─────────────────────────────────────────── */
const ProductDet = ({ productId }: { productId: number }) => {
  usePageViewLog({ pageType: 'ProductDet', productId: productId });

  const getFileUrl = useWebCommonStore((s) => s.getFileUrl);
  const categoryReady = usePartnerCodeStore((s) => s.categoryReady);
  const { mutateAsync: addCartItem, isPending: isAdding } = useAddCartItem();
  const { data: cartData } = useCartQuery();
  const swipeRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState<{ rep?: string; detail: string[]; size: string[]; etc?: string }>({ detail: [], size: [] });
  const [relatedWithSrc, setRelatedWithSrc] = useState<RelatedProductWithSrc[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  /* ── API 호출 ─────────────────────────────────────────── */
  const { data, isSuccess, isLoading } = useQuery({
    queryKey: ['/frontWeb/product/productDetail', productId],
    queryFn: () => publicApi.get('/frontWeb/product/productDetail', { params: { productId } }),
    enabled: categoryReady && !!productId,
  });

  const product: ProductResponseProductDetail | null = isSuccess && data?.data?.resultCode === 200 ? data.data.body : null;

  /* ── 색상 / 사이즈 목록 파생 ─────────────────────────── */
  const colors = useMemo(() => {
    if (!product) return [];
    return [...new Set((product.detList ?? []).map((d) => d.productDetColor).filter(Boolean))] as string[];
  }, [product]);

  const colorHexMap = useMemo(() => {
    const map: Record<string, string> = {};
    (product?.detList ?? []).forEach((d) => {
      const hex = (d as any).stndrColor as string | undefined;
      if (d.productDetColor && hex) map[d.productDetColor] = hex;
    });
    return map;
  }, [product]);

  const sizes = useMemo(() => {
    if (!product) return [];
    const filtered = selectedColor ? (product.detList ?? []).filter((d) => d.productDetColor === selectedColor) : product.detList ?? [];
    return [...new Set(filtered.map((d) => d.productDetSize).filter(Boolean))] as string[];
  }, [product, selectedColor]);

  const stockMap = useMemo(() => {
    const map: Record<number, number> = {};
    (product?.detList ?? []).forEach((d) => {
      if (d.id != null) map[d.id] = d.stock ?? 0;
    });
    return map;
  }, [product]);

  const matchedDet: ProductResponseProductDetInfo | null = useMemo(() => {
    if (!product) return null;
    if ((product.detList ?? []).length === 0) return null;
    if (colors.length > 0 && sizes.length === 0 && selectedColor) {
      return product.detList?.find((d) => d.productDetColor === selectedColor) ?? null;
    }
    if (colors.length === 0 && sizes.length > 0 && selectedSize) {
      return product.detList?.find((d) => d.productDetSize === selectedSize) ?? null;
    }
    if (selectedColor && selectedSize) {
      return product.detList?.find((d) => d.productDetColor === selectedColor && d.productDetSize === selectedSize) ?? null;
    }
    return null;
  }, [product, colors, sizes, selectedColor, selectedSize]);

  useEffect(() => {
    if (!product) return;
    if (colors.length === 1) setSelectedColor(colors[0]);
  }, [product?.id, colors.length]);

  useEffect(() => {
    if (!product) return;
    if (sizes.length === 1) setSelectedSize(sizes[0]);
  }, [product?.id, sizes.length, selectedColor]);

  const handleColorSelect = (color: string) => {
    setSelectedColor((prev) => (prev === color ? null : color));
    setSelectedSize(null);
  };

  const selectFileList = useWebCommonStore((s) => s.selectFileList);

  useEffect(() => {
    if (!product) return;
    (async () => {
      const rep = product.repSysFileNm ? await getFileUrl(product.repSysFileNm) : undefined;
      const etc = product.etcSysFileNm ? await getFileUrl(product.etcSysFileNm) : undefined;

      const detailFiles = product.detailFileId ? await selectFileList(product.detailFileId) : [];
      const sizeFiles = product.sizeFileId ? await selectFileList(product.sizeFileId) : [];

      const detail: string[] = [];
      for (const f of detailFiles) {
        if (f.sysFileNm) {
          const u = await getFileUrl(f.sysFileNm);
          if (u) detail.push(u);
        }
      }
      const size: string[] = [];
      for (const f of sizeFiles) {
        if (f.sysFileNm) {
          const u = await getFileUrl(f.sysFileNm);
          if (u) size.push(u);
        }
      }

      setImages({ rep, detail, size, etc });

      const related: RelatedProductWithSrc[] = [];
      for (const r of product.relatedList ?? []) {
        const src = r.sysFileNm ? await getFileUrl(r.sysFileNm) : undefined;
        related.push({ ...r, src });
      }
      setRelatedWithSrc(related);
    })();
  }, [product?.id]);

  /* ── 장바구니 담기 ─────────────────────────────────────── */
  const handleAddToCart = async () => {
    if (!product) return;

    const hasDet = (product.detList ?? []).length > 0;

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
      if (matchedDet.id != null && (stockMap[matchedDet.id] ?? 0) <= 0) {
        toastError('재고가 없습니다.');
        return;
      }
    }

    const productDetId = matchedDet?.id ?? product.detList?.[0]?.id ?? product.id;

    const alreadyInCart = cartData?.items.some((i) => i.productDetId === productDetId);
    if (alreadyInCart) {
      toastError('이미 장바구니에 담긴 상품입니다.');
      return;
    }

    try {
      if (productDetId) {
        await addCartItem({ productDetId, quantity: 1 });
        toastSuccess('장바구니에 담았습니다 🛒');
      }
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
  const noStock = matchedDet?.id != null && (stockMap[matchedDet.id] ?? 0) <= 0;

  return (
    <div className={styles.wrap}>
      {/* ── PC: 좌우 2열 / 모바일: 단일 열 ── */}
      <div className={styles.pcGrid}>

        {/* ── 좌측(PC) / 상단(모바일): 이미지 ── */}
        <section className={styles.imageSection}>
          <ProductImage src={images.rep} alt={product.prodNm ?? ''} />
          {images.detail.map((src, i) => (
            <ProductImage key={`detail-${i}`} src={src} alt={`${product.prodNm} 상세`} />
          ))}
          {images.size.map((src, i) => (
            <ProductImage key={`size-${i}`} src={src} alt={`${product.prodNm} 사이즈`} />
          ))}
          <ProductImage src={images.etc} alt={`${product.prodNm} 기타`} />
          {!images.rep && images.detail.length === 0 && images.size.length === 0 && !images.etc && (
            <div className={`${styles.productImg} ${styles.imgPlaceholder}`} />
          )}
        </section>

        {/* ── 우측(PC) / 하단(모바일): 상품 정보 ── */}
        <div className={styles.rightCol}>

          {/* 기본 정보 */}
          <section className={styles.infoSection}>
            <h1 className={styles.prodNm}>{product.prodNm}</h1>
            <div className={styles.priceRow}>
              {(product.discountRate ?? 0) > 0 && <span className={styles.discount}>{product.discountRate}%</span>}
              <span className={styles.price}>{discountedPrice.toLocaleString()}원</span>
              {(product.discountRate ?? 0) > 0 && product.orgAmt && <span className={styles.orgPrice}>{product.orgAmt.toLocaleString()}원</span>}
            </div>
            {((product as any).thickTpNm || (product as any).spanTpNm || (product as any).showTpNm || (product as any).laundryTpNm || (product as any).cleaningTpNm) && (
              <ul className={styles.attrList}>
                {(product as any).thickTpNm   && <li><span className={styles.attrLabel}>두께</span><span className={styles.attrVal}>{(product as any).thickTpNm}</span></li>}
                {(product as any).spanTpNm    && <li><span className={styles.attrLabel}>신축성</span><span className={styles.attrVal}>{(product as any).spanTpNm}</span></li>}
                {(product as any).showTpNm    && <li><span className={styles.attrLabel}>비침</span><span className={styles.attrVal}>{(product as any).showTpNm}</span></li>}
                {(product as any).laundryTpNm && <li><span className={styles.attrLabel}>세탁</span><span className={styles.attrVal}>{(product as any).laundryTpNm}</span></li>}
                {(product as any).transTpNm   && <li><span className={styles.attrLabel}>안감</span><span className={styles.attrVal}>{(product as any).transTpNm}</span></li>}
              </ul>
            )}
          </section>

          {/* 옵션 선택 */}
          {hasDet && (
            <section className={styles.skuSection}>
              {hasColor && (
                <>
                  <p className={styles.skuLabel}>
                    색상
                    {selectedColor && <span className={styles.skuSelected}> · {selectedColor}</span>}
                  </p>
                  <div className={styles.skuList}>
                    {colors.map((color) => {
                      const colorStock = (product?.detList ?? [])
                        .filter((d) => d.productDetColor === color)
                        .reduce((sum, d) => sum + (d.id != null ? stockMap[d.id] ?? 0 : 0), 0);
                      const soldOut = colorStock <= 0;
                      const hex = colorHexMap[color];
                      return (
                        <button
                          key={color}
                          className={`${styles.skuChip} ${selectedColor === color ? styles.skuChipSelected : ''} ${soldOut ? styles.skuChipSoldOut : ''}`}
                          onClick={() => (soldOut ? toastError(`[${color}] 품절입니다.`) : handleColorSelect(color))}
                          disabled={false}
                          title={color}
                          aria-label={color}
                        >
                          <span style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            {hex ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  border: '1px solid rgba(0,0,0,0.2)',
                                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                                  background: `#${hex}`,
                                }}
                              />
                            ) : (
                              color
                            )}
                            {soldOut && <span style={{ fontSize: 11, color: '#000', fontWeight: 600, lineHeight: 1 }}>품절</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {hasSize && (!hasColor || selectedColor) && (
                <div className={styles.skuSizeWrap}>
                  <p className={styles.skuLabel}>
                    사이즈
                    {selectedSize && <span className={styles.skuSelected}> · {selectedSize}</span>}
                  </p>
                  <div className={styles.skuList}>
                    {sizes.map((size) => {
                      const det =
                        (product?.detList ?? []).find((d) => d.productDetColor === selectedColor && d.productDetSize === size) ??
                        (product?.detList ?? []).find((d) => d.productDetSize === size);
                      const sizeStock = det?.id != null ? stockMap[det.id] ?? 0 : 0;
                      const soldOut = sizeStock <= 0;
                      return (
                        <button
                          key={size}
                          className={`${styles.skuChip} ${selectedSize === size ? styles.skuChipSelected : ''} ${soldOut ? styles.skuChipSoldOut : ''}`}
                          onClick={() => !soldOut && setSelectedSize((prev) => (prev === size ? null : size))}
                          disabled={soldOut}
                        >
                          {size}
                          {soldOut && <span className={styles.soldOutBadge}> 품절</span>}
                        </button>
                      );
                    })}
                  </div>
                  {matchedDet?.id != null && (
                    <p className={styles.stockInfo}>
                      재고: <strong>{Math.max(0, stockMap[matchedDet.id] ?? 0)}</strong>개
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* 배송 안내 */}
          <section className={styles.deliveryInfo}>
            <p className={styles.deliveryTitle}>배송 안내</p>
            <p className={styles.deliveryDesc}>배송완료까지 7일 이내 소요됩니다.</p>
          </section>

          {/* 장바구니 버튼 */}
          <div className={styles.bottomBar}>
            <button
              className={styles.cartBtn}
              onClick={handleAddToCart}
              disabled={isAdding || noStock}
              aria-label="장바구니 담기"
              style={noStock ? { background: '#ccc', cursor: 'not-allowed' } : undefined}
            >
              {isAdding ? '담는 중...' : noStock ? '품절' : '장바구니에 담기'}
            </button>
          </div>

          {/* 상품정보 */}
          {(product as any).detInfo && (
            <div className={styles.extraSection}>
              <p className={styles.sectionTitle}>상품정보</p>
              <p className={styles.detailInfo}>{(product as any).detInfo}</p>
            </div>
          )}

          {/* 혼용율 */}
          {(product as any).composition && (
            <div className={styles.extraSection}>
              <p className={styles.sectionTitle}>혼용율</p>
              <p className={styles.composition}>{(product as any).composition}</p>
            </div>
          )}

          {/* 유의사항 */}
          <div className={styles.noticeSection}>
            <p className={styles.sectionTitle}>유의사항</p>
            <ul className={styles.noticeList}>
              {NOTICES.map((notice, i) => (
                <li key={i}>{notice}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── 연관 상품 (전체 너비) ── */}
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

      {/* ── AI 상품 채팅 ── */}
      <ProductAiChat productId={product.id ?? 0} />

      {/* ── 구매 후기 ── */}
      <ReviewSection productId={product.id ?? 0} />
    </div>
  );
};

/* ── 상품 Q&A 섹션 ───────────────────────────────────────── */
interface ProductQnaItem {
  comuId: number;
  question: string;
  creUser: string;
  creTm: string;
  answer?: string;
  answerTm?: string;
}

const maskName = (name: string) => {
  if (!name) return '***';
  if (name.length <= 1) return name + '**';
  return name[0] + '*'.repeat(name.length - 1);
};

function ProductQnaSection({ productId }: { productId: number }) {
  const { data: session } = useSession();
  const socialAccountId = (session as any)?.socialAccountId;
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { data: qnaList = [] } = useQuery<ProductQnaItem[]>({
    queryKey: ['productQna', productId],
    queryFn: async () => {
      const res = await publicApi.get(`/frontWeb/comu/product/${productId}/qna`);
      return res.data?.body ?? [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data } = await authApi.post(`/frontWeb/comu/product/${productId}/qna`, {
        socialAccountId,
        content,
      });
      if (data?.resultCode !== 200) throw new Error(data?.resultMessage ?? '등록 실패');
    },
    onSuccess: () => {
      setContent('');
      toastSuccess('문의가 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['productQna', productId] });
    },
    onError: (e: any) => toastError(e?.message ?? '문의 등록에 실패했습니다.'),
  });

  return (
    <section className={styles.qnaSection}>
      <p className={styles.qnaTitle}>상품 Q&amp;A</p>

      {session ? (
        <div className={styles.qnaForm}>
          <textarea
            className={styles.qnaInput}
            placeholder="상품에 대해 궁금한 점을 남겨주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <button className={styles.qnaSubmitBtn} onClick={() => submitMutation.mutate()} disabled={!content.trim() || submitMutation.isPending}>
            문의 등록
          </button>
        </div>
      ) : (
        <p className={styles.qnaLoginNote}>
          <Link href="/login">로그인</Link> 후 문의를 남길 수 있습니다.
        </p>
      )}

      {qnaList.length === 0 ? (
        <p className={styles.qnaEmpty}>등록된 문의가 없습니다.</p>
      ) : (
        <ul className={styles.qnaList}>
          {qnaList.map((item) => (
            <li key={item.comuId} className={styles.qnaItem}>
              <div className={styles.qnaQ}>
                <span className={styles.qnaBadge}>Q</span>
                <div>
                  <p className={styles.qnaContent}>{item.question}</p>
                  <p className={styles.qnaMeta}>
                    {maskName(item.creUser)} · {new Date(item.creTm).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {item.answer && (
                <div className={styles.qnaA}>
                  <span className={`${styles.qnaBadge} ${styles.qnaBadgeA}`}>A</span>
                  <div>
                    <p className={styles.qnaContent}>{item.answer}</p>
                    <p className={styles.qnaMeta}>{item.answerTm ? new Date(item.answerTm).toLocaleDateString() : ''}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ProductDet;
