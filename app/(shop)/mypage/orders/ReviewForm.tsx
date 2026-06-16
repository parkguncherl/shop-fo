'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/libs/api';
import { toastSuccess, toastError } from '@/components/common/Others/ToastMessage';
import styles from './ReviewForm.module.scss';

interface ReviewFormProps {
  socialAccountId: number;
  orderItemId: number;
  productId: number;
  productDetId?: number | null;
  productName: string;
  existingReview?: {
    id: number;
    rating: number;
    content: string;
  } | null;
  onClose: () => void;
}

const STARS = [1, 2, 3, 4, 5];

export default function ReviewForm({
  socialAccountId,
  orderItemId,
  productId,
  productDetId,
  productName,
  existingReview,
  onClose,
}: ReviewFormProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(existingReview);

  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState(existingReview?.content ?? '');

  // 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && existingReview) {
        const { data } = await authApi.put(`/frontWeb/review/${existingReview.id}`, {
          socialAccountId,
          rating,
          content,
        });
        return data?.body;
      } else {
        const { data } = await authApi.post('/frontWeb/review', {
          socialAccountId,
          orderItemId,
          productId,
          productDetId,
          rating,
          content,
        });
        return data?.body;
      }
    },
    onSuccess: () => {
      toastSuccess(isEdit ? '리뷰가 수정되었습니다.' : `리뷰가 등록되었습니다. 100P가 적립됩니다!`);
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['productReviews'] });
      onClose();
    },
    onError: (error: { message?: string }) => {
      toastError(error?.message || '리뷰 저장 중 오류가 발생했습니다.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 10) {
      toastError('리뷰 내용을 10자 이상 입력해주세요.');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2>{isEdit ? '리뷰 수정' : '리뷰 작성'}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <p className={styles.productName}>{productName}</p>

          {/* 별점 */}
          <div className={styles.ratingWrap}>
            <span className={styles.label}>별점</span>
            <div
              className={styles.stars}
              onMouseLeave={() => setHoverRating(0)}
            >
              {STARS.map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${(hoverRating || rating) >= star ? styles.starFilled : ''}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => setRating(star)}
                  aria-label={`${star}점`}
                >
                  ★
                </button>
              ))}
              <span className={styles.ratingText}>{hoverRating || rating}점</span>
            </div>
          </div>

          {/* 내용 */}
          <div className={styles.contentWrap}>
            <label className={styles.label} htmlFor="review-content">
              리뷰 내용
            </label>
            <textarea
              id="review-content"
              className={styles.textarea}
              placeholder="상품에 대한 솔직한 리뷰를 작성해주세요. (최소 10자)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              rows={5}
              required
            />
            <span className={styles.charCount}>{content.length} / 1000</span>
          </div>

          <div className={styles.footer}>
            {!isEdit && (
              <p className={styles.pointNotice}>리뷰 작성 시 <strong>100P</strong> 적립</p>
            )}
            <div className={styles.buttons}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                취소
              </button>
              <button type="submit" className={styles.submitBtn} disabled={mutation.isPending}>
                {mutation.isPending ? '저장 중...' : isEdit ? '수정 완료' : '등록하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
