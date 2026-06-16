'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/libs/api';
import { toastSuccess, toastError } from '@/components/common/Others/ToastMessage';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import styles from './ReviewForm.module.scss';

const MAX_IMAGES = 5;

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
    fileId?: number | null;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectFileList, getFileUrl } = useWebCommonStore();

  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState(existingReview?.content ?? '');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 수정 모드: 기존 이미지 URL (서버에 이미 저장된 이미지)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  // 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // 수정 모드에서 기존 이미지 로드
  useEffect(() => {
    if (!isEdit || !existingReview?.fileId) return;
    (async () => {
      const files = await selectFileList(existingReview.fileId!);
      const urls = await Promise.all(
        files.map((f) => f.sysFileNm ? getFileUrl(f.sysFileNm) : Promise.resolve(''))
      );
      setExistingImageUrls(urls.filter(Boolean));
    })();
  }, []);

  // 미리보기 URL 정리
  useEffect(() => {
    return () => { previewUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [previewUrls]);

  const totalImageCount = existingImageUrls.length + imageFiles.length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - totalImageCount;
    if (remaining <= 0) return;
    const accepted = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...accepted]);
    setPreviewUrls((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      // 이미지가 있으면 먼저 업로드해서 fileId 획득
      let fileId: number | undefined = existingReview?.fileId ?? undefined;
      if (imageFiles.length > 0) {
        const formData = new FormData();
        formData.append('fileId', String(fileId ?? 0));
        imageFiles.forEach((f) => formData.append('uploadFiles', f));
        const uploadRes = await authApi.post('/frontWeb/webCommon/imgfile/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        });
        fileId = uploadRes.data?.body ?? fileId;
      }

      if (isEdit && existingReview) {
        const { data } = await authApi.put(`/frontWeb/review/${existingReview.id}`, {
          socialAccountId,
          rating,
          content,
          fileId,
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
          fileId,
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
    if (content.trim().length < 3) {
      toastError('리뷰 내용을 3자 이상 입력해주세요.');
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

          {/* 이미지 업로드 */}
          <div className={styles.imageUploadWrap}>
            <span className={styles.label}>사진 첨부 <span className={styles.labelSub}>(선택 · 최대 {MAX_IMAGES}장)</span></span>
            <div className={styles.imagePreviewList}>
              {/* 기존 이미지 (수정 모드) */}
              {existingImageUrls.map((url, i) => (
                <div key={`existing-${i}`} className={`${styles.previewItem} ${styles.existingItem}`}>
                  <img src={url} alt={`기존 이미지 ${i + 1}`} className={styles.previewImg} />
                  <span className={styles.existingBadge}>저장됨</span>
                </div>
              ))}
              {/* 새로 추가한 이미지 */}
              {previewUrls.map((url, i) => (
                <div key={`new-${i}`} className={styles.previewItem}>
                  <img src={url} alt={`미리보기 ${i + 1}`} className={styles.previewImg} />
                  <button type="button" className={styles.removeBtn} onClick={() => removeImage(i)} aria-label="이미지 삭제">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
              {totalImageCount < MAX_IMAGES && (
                <button type="button" className={styles.addImageBtn} onClick={() => fileInputRef.current?.click()}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>{totalImageCount}/{MAX_IMAGES}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className={styles.hiddenInput}
              onChange={handleImageChange}
            />
          </div>

          {/* 내용 */}
          <div className={styles.contentWrap}>
            <label className={styles.label} htmlFor="review-content">
              리뷰 내용
            </label>
            <textarea
              id="review-content"
              className={styles.textarea}
              placeholder="상품에 대한 솔직한 리뷰를 작성해주세요. (최소 3자)"
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
