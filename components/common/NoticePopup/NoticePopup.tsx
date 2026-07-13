'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { publicApi } from '@/libs/api';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import styles from './NoticePopup.module.scss';

interface PopupNotice {
  id: number;
  title: string;
  fileId?: number;
  sysFileNm?: string;
  moveUri?: string;
}

const SESSION_KEY = 'popup_notice_closed';
const TRIGGER_PATHS = ['/', '/products/10000'];

const NoticePopup = () => {
  const pathname = usePathname();
  const getFileUrl = useWebCommonStore((s) => s.getFileUrl);
  const noticeVisible = useWebCommonStore((s) => s.noticeVisible);
  const showNotice = useWebCommonStore((s) => s.showNotice);
  const hideNotice = useWebCommonStore((s) => s.hideNotice);
  const [notices, setNotices] = useState<(PopupNotice & { imgUrl?: string })[]>([]);
  const [index, setIndex] = useState(0);
  const autoPlayDone = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  // 공지 목록 최초 1회 로드
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    publicApi.get('/frontWeb/notice/popupList').then(async ({ data }) => {
      if (data?.resultCode !== 200 || !data.body?.length) return;
      const items: PopupNotice[] = data.body;
      const withUrls = await Promise.all(
        items.map(async (n) => ({
          ...n,
          imgUrl: n.sysFileNm ? await getFileUrl(n.sysFileNm) : undefined,
        }))
      );
      setNotices(withUrls);
    }).catch(() => {});
  }, []);

  // 지정 경로 진입 시 세션 최초 1회 자동 오픈
  useEffect(() => {
    if (!TRIGGER_PATHS.includes(pathname)) return;
    if (notices.length === 0) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    showNotice();
  }, [pathname, notices]);

  useEffect(() => {
    if (!noticeVisible) {
      autoPlayDone.current = false;
      setIndex(0);
    }
  }, [noticeVisible]);

  useEffect(() => {
    if (!noticeVisible || notices.length <= 1 || autoPlayDone.current) return;

    timerRef.current = setTimeout(function tick() {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= notices.length) {
          autoPlayDone.current = true;
          return 0;
        }
        timerRef.current = setTimeout(tick, 2500);
        return next;
      });
    }, 2500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [noticeVisible, notices.length]);

  if (!noticeVisible || notices.length === 0) return null;

  const current = notices[index];

  const handleClose = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    hideNotice();
  };

  const handleImageClick = () => {
    if (current.moveUri) window.location.href = current.moveUri;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.imageArea}>
          {current.imgUrl && (
            <img
              src={current.imgUrl}
              alt={current.title}
              className={styles.image}
              style={{ cursor: current.moveUri ? 'pointer' : 'default' }}
              onClick={handleImageClick}
            />
          )}
        </div>

        <p className={styles.title}>{current.title}</p>

        {notices.length > 1 && (
          <div className={styles.dots}>
            {notices.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.btnClose} onClick={handleClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default NoticePopup;
