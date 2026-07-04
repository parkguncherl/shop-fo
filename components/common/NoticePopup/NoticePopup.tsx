'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getCookie, setCookie } from 'cookies-next';
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

const COOKIE_KEY = 'popup_notice_hidden';

const NoticePopup = () => {
  const getFileUrl = useWebCommonStore((s) => s.getFileUrl);
  const noticeVisible = useWebCommonStore((s) => s.noticeVisible);
  const showNotice = useWebCommonStore((s) => s.showNotice);
  const hideNotice = useWebCommonStore((s) => s.hideNotice);
  const [notices, setNotices] = useState<(PopupNotice & { imgUrl?: string })[]>([]);
  const [index, setIndex] = useState(0);
  const autoPlayDone = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
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

      const hidden = getCookie(COOKIE_KEY);
      if (hidden !== new Date().toISOString().slice(0, 10)) {
        showNotice();
      }
    }).catch(() => {});
  }, []);

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

  const handleHideToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setCookie(COOKIE_KEY, today, { expires: new Date(new Date().setHours(23, 59, 59, 999)) });
    hideNotice();
  };

  const handleClose = () => hideNotice();

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
          <button className={styles.btnHide} onClick={handleHideToday}>오늘 하루 보지 않기</button>
          <button className={styles.btnClose} onClick={handleClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default NoticePopup;
