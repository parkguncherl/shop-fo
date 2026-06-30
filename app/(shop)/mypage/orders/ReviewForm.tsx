'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/libs/api';
import publicApi from '@/libs/publicApi';
import { usePartnerCode } from '@/hooks/usePartnerCode';
import { toastSuccess, toastError } from '@/components/common/Others/ToastMessage';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { FileDet } from '@/generated';
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
    myFit?: string | null;
    myWeight?: string | null;
    myHeight?: string | null;
  } | null;
  onClose: () => void;
}

const STARS = [1, 2, 3, 4, 5];

export default function ReviewForm({ socialAccountId, orderItemId, productId, productDetId, productName, existingReview, onClose }: ReviewFormProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(existingReview);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectFileList, getFileUrl } = useWebCommonStore();

  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState(existingReview?.content ?? '');
  const [myFit, setMyFit] = useState(existingReview?.myFit ?? '');
  const [myWeight, setMyWeight] = useState(existingReview?.myWeight ?? '');
  const [myHeight, setMyHeight] = useState(existingReview?.myHeight ?? '');

  const { data: fitOptions = [] } = usePartnerCode('P0003');
  const { data: heightOptions = [] } = usePartnerCode('P0004');
  const { data: weightOptions = [] } = usePartnerCode('P0005');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 수정 모드: 기존 이미지 (FileDet + presigned URL)
  const [existingImages, setExistingImages] = useState<{ fileDet: FileDet; url: string }[]>([]);

  // 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // 수정 모드에서 기존 이미지 로드
  useEffect(() => {
    if (!isEdit || !existingReview?.fileId) return;
    (async () => {
      const files = await selectFileList(existingReview.fileId!);
      const entries = await Promise.all(
        files.map(async (f) => {
          const url = f.sysFileNm ? await getFileUrl(f.sysFileNm) : '';
          return url ? { fileDet: f, url } : null;
        }),
      );
      setExistingImages(entries.filter(Boolean) as { fileDet: FileDet; url: string }[]);
    })();
  }, []);

  // 미리보기 URL 정리
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const totalImageCount = existingImages.length + imageFiles.length;

  const removeExistingImage = async (index: number) => {
    const target = existingImages[index];
    if (!target) return;
    try {
      await publicApi.delete(`/frontWeb/webCommon/fileDet/${target.fileDet.id}`);
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } catch {
      toastError('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

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
      // 기존 이미지가 남아있으면 같은 fileId 유지, 전부 삭제됐으면 null
      const keepExisting = existingImages.length > 0;
      let fileId: number | null | undefined = keepExisting ? existingReview?.fileId ?? undefined : null;

      if (imageFiles.length > 0) {
        const formData = new FormData();
        formData.append('fileId', String(keepExisting ? existingReview?.fileId ?? 0 : 0));
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
          myFit: myFit || null,
          myWeight: myWeight || null,
          myHeight: myHeight || null,
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
          myFit: myFit || null,
          myWeight: myWeight || null,
          myHeight: myHeight || null,
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
            <div className={styles.stars} onMouseLeave={() => setHoverRating(0)}>
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

          {/* 설문 */}
          {[
            { label: '사이즈는 어떤가요?', options: fitOptions, value: myFit, setValue: setMyFit },
            { label: '키는 어떤가요?', options: heightOptions, value: myHeight, setValue: setMyHeight },
            { label: '몸무게는 어떤가요?', options: weightOptions, value: myWeight, setValue: setMyWeight },
          ].map(({ label, options, value, setValue }) =>
            options.length > 0 ? (
              <div key={label} className={styles.surveyWrap}>
                <span className={styles.label}>
                  {label} <span className={styles.labelSub}>(선택)</span>
                </span>
                <div className={styles.surveyTrack}>
                  {options.map((opt, idx) => (
                    <div key={opt.codeCd} className={styles.surveyItem}>
                      {idx > 0 && <div className={styles.surveyLine} />}
                      <button
                        type="button"
                        className={`${styles.surveyCircle} ${value === opt.codeCd ? styles.surveyCircleActive : ''}`}
                        onClick={() => setValue(value === opt.codeCd ? '' : opt.codeCd!)}
                        aria-label={opt.codeNm}
                      />
                      <span className={styles.surveyItemLabel}>{opt.codeNm}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null,
          )}

          {/* 이미지 업로드 */}
          <div className={styles.imageUploadWrap}>
            <span className={styles.label}>
              사진 첨부 <span className={styles.labelSub}>(선택 · 최대 {MAX_IMAGES}장)</span>
            </span>
            <div className={styles.imagePreviewList}>
              {/* 기존 이미지 (수정 모드) — X 클릭 시 즉시 TB_FILE_DET 삭제 */}
              {existingImages.map(({ url }, i) => (
                <div key={`existing-${i}`} className={`${styles.previewItem} ${styles.existingItem}`}>
                  <img src={url} alt={`기존 이미지 ${i + 1}`} className={styles.previewImg} />
                  <button type="button" className={styles.removeBtn} onClick={() => removeExistingImage(i)} aria-label="기존 이미지 삭제">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
              {/* 새로 추가한 이미지 */}
              {previewUrls.map((url, i) => (
                <div key={`new-${i}`} className={styles.previewItem}>
                  <img src={url} alt={`미리보기 ${i + 1}`} className={styles.previewImg} />
                  <button type="button" className={styles.removeBtn} onClick={() => removeImage(i)} aria-label="이미지 삭제">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
              {totalImageCount < MAX_IMAGES && (
                <button type="button" className={styles.addImageBtn} onClick={() => fileInputRef.current?.click()}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>
                    {totalImageCount}/{MAX_IMAGES}
                  </span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={handleImageChange} />
          </div>

          {/* 내용 */}
          <div className={styles.contentWrap}>
            <label className={styles.label} htmlFor="review-content">
              리뷰 내용
            </label>
            <textarea
              id="review-content"
              className={styles.textarea}
              placeholder="상품에 대한 솔직한 리뷰를 작성해주세요. (선택)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              rows={5}
            />
            <span className={styles.charCount}>{content.length} / 1000</span>
          </div>

          <div className={styles.footer}>
            {!isEdit && (
              <p className={styles.pointNotice}>
                리뷰 작성 시 <strong>100P</strong> 적립
              </p>
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
