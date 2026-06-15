'use client';
import React, { useEffect } from 'react';
import DaumPostcodeEmbed, { type Address } from 'react-daum-postcode';
import styles from './AddressSearchModal.module.scss';

interface AddressSearchModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: Address) => void;
}

export default function AddressSearchModal({ open, onClose, onComplete }: AddressSearchModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const handleComplete = (data: Address) => {
    onComplete(data);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg className={styles.pinIcon} width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
            <h3 className={styles.title}>주소 검색</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.hint}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>도로명, 지번, 건물명으로 검색하세요</span>
        </div>

        <div className={styles.embedWrap}>
          <DaumPostcodeEmbed
            onComplete={handleComplete}
            autoClose={false}
            style={{ width: '100%', height: '100%' }}
            theme={{
              searchBgColor: '#1a1a1a',
              queryTextColor: '#ffffff',
              postcodeTextColor: '#c8a876',
              emphTextColor: '#c8a876',
              outlineColor: '#eeeeee',
            }}
          />
        </div>
      </div>
    </div>
  );
}
