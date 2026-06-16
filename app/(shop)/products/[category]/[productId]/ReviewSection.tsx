'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import publicApi from '@/libs/publicApi';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import styles from './ReviewSection.module.scss';

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
  const selectFileList = useWebCommonStore((s) => s.selectFileList);
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

  // 리뷰 이미지 로드
  useEffect(() => {
    if (!reviews.length) return;
    const reviewsWithFile = reviews.filter((r) => r.fileId);
    if (!reviewsWithFile.length) return;

    (async () => {
      const entries = await Promise.all(
        reviewsWithFile.map(async (r) => {
          const files = await selectFileList(r.fileId!);
          const urls = files.map((f) => f.sysFileNm ?? '').filter(Boolean);
          return [r.id, urls] as [number, string[]];
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
                  <div className={styles.imageList}>
                    {images.map((src, i) => (
                      <img key={i} src={src} alt={`리뷰 이미지 ${i + 1}`} className={styles.reviewImage} />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
