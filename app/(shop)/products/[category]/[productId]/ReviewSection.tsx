'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import publicApi from '@/libs/publicApi';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import styles from './ReviewSection.module.scss';

function ReviewImageSwiper({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // 슬라이드 1개 너비(margin 포함)를 기준으로 스크롤
  const getSlideWidth = () => {
    const el = trackRef.current;
    if (!el) return 0;
    const slide = el.querySelector<HTMLElement>(`.${styles.swiperSlide}`);
    if (!slide) return 0;
    const style = getComputedStyle(slide);
    return slide.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
  };

  const goTo = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    const slideWidth = getSlideWidth();
    // padding-inline 만큼 오프셋 보정하여 중앙 슬라이드 정렬
    el.scrollTo({ left: slideWidth * idx, behavior: 'smooth' });
    setActiveIndex(idx);
  };

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const slideWidth = getSlideWidth();
    if (slideWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / slideWidth));
  };

  return (
    <>
      <div className={styles.swiper}>
        <div className={styles.swiperTrack} ref={trackRef} onScroll={handleScroll}>
          {images.map((src, i) => (
            <div key={i} className={styles.swiperSlide}>
              <img
                src={src}
                alt={`리뷰 이미지 ${i + 1}`}
                className={styles.swiperImg}
                onClick={() => setLightbox(src)}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={() => goTo(activeIndex - 1)} aria-label="이전">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            {activeIndex < images.length - 1 && (
              <button className={`${styles.navBtn} ${styles.navNext}`} onClick={() => goTo(activeIndex + 1)} aria-label="다음">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <div className={styles.dots}>
              {images.map((_, i) => (
                <button key={i} className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`} onClick={() => goTo(i)} aria-label={`${i + 1}번 이미지`} />
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="리뷰 이미지 확대" className={styles.lightboxImg} />
          <button className={styles.lightboxClose} onClick={() => setLightbox(null)} aria-label="닫기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

interface ReviewItem {
  id: number;
  socialAccountId: number;
  rating: number;
  content: string;
  fileId?: number | null;
  creTm: string;
}

interface ProductReviewData {
  productId: number;
  avgRating: number;
  reviewCount: number;
  reviews: ReviewItem[];
}

const STARS = [1, 2, 3, 4, 5];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};

const StarDisplay = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <span className={styles.starDisplay} aria-label={`${rating}점`}>
    {STARS.map((s) => (
      <span key={s} className={s <= rating ? styles.starOn : styles.starOff} style={{ fontSize: size }}>
        ★
      </span>
    ))}
  </span>
);

export default function ReviewSection({ productId }: { productId: number }) {
  const { selectFileList, getFileUrl } = useWebCommonStore();
  const [imageMap, setImageMap] = useState<Record<number, string[]>>({});

  const { data, isLoading } = useQuery<ProductReviewData>({
    queryKey: ['productReviews', productId],
    queryFn: async () => {
      const res = await publicApi.get(`/frontWeb/review/product/${productId}`);
      return res.data?.body;
    },
    enabled: Boolean(productId),
  });

  const reviews = data?.reviews ?? [];
  const avgRating = data?.avgRating ?? 0;
  const reviewCount = data?.reviewCount ?? 0;

  // 리뷰 이미지 로드 — sysFileNm → getFileUrl() 로 presigned URL 변환
  useEffect(() => {
    if (!reviews.length) return;
    const reviewsWithFile = reviews.filter((r) => r.fileId);
    if (!reviewsWithFile.length) return;

    (async () => {
      const entries = await Promise.all(
        reviewsWithFile.map(async (r) => {
          const files = await selectFileList(r.fileId!);
          const urls = await Promise.all(
            files.map((f) => f.sysFileNm ? getFileUrl(f.sysFileNm) : Promise.resolve(''))
          );
          return [r.id, urls.filter(Boolean)] as [number, string[]];
        }),
      );
      setImageMap(Object.fromEntries(entries));
    })();
  }, [reviews.map((r) => r.id).join(',')]);

  if (isLoading) {
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>구매 후기</h2>
        </div>
        <div className={styles.skeleton} />
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>구매 후기</h2>
        <span className={styles.reviewCount}>{reviewCount}개</span>
      </div>

      {reviewCount > 0 && (
        <div className={styles.summary}>
          <span className={styles.avgScore}>{avgRating.toFixed(1)}</span>
          <StarDisplay rating={Math.round(avgRating)} size={20} />
          <span className={styles.summaryCount}>({reviewCount})</span>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className={styles.empty}>
          <p>아직 작성된 리뷰가 없습니다.</p>
          <span>구매 후 첫 리뷰를 남겨보세요!</span>
        </div>
      ) : (
        <ul className={styles.list}>
          {reviews.map((review) => {
            const images = imageMap[review.id] ?? [];
            return (
              <li key={review.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <StarDisplay rating={review.rating} />
                  <span className={styles.date}>{formatDate(review.creTm)}</span>
                </div>
                <p className={styles.content}>{review.content}</p>
                {images.length > 0 && (
                  <ReviewImageSwiper images={images} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
