'use client';

import React, { useEffect, useState } from 'react';
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
  const [notices, setNotices] = useState<(PopupNotice & { imgUrl?: string })[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hidden = getCookie(COOKIE_KEY);
    if (hidden === new Date().toISOString().slice(0, 10)) return;

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
      setVisible(true);
    }).catch(() => {});
  }, []);

  if (!visible || notices.length === 0) return null;

  const current = notices[index];

  const handleHideToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setCookie(COOKIE_KEY, today, { expires: new Date(new Date().setHours(23, 59, 59, 999)) });
    setVisible(false);
  };

  const handleClose = () => setVisible(false);

  const handleImageClick = () => {
    if (current.moveUri) window.location.href = current.moveUri;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.imageArea}>
          {current.imgUrl ? (
            <img
              src={current.imgUrl}
              alt={current.title}
              className={styles.image}
              style={{ cursor: current.moveUri ? 'pointer' : 'default' }}
              onClick={handleImageClick}
            />
          ) : (
            <div className={styles.noImage}>{current.title}</div>
          )}
        </div>

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

        {notices.length > 1 && (
          <div className={styles.arrows}>
            <button className={styles.arrow} onClick={() => setIndex((i) => (i - 1 + notices.length) % notices.length)}>‹</button>
            <span className={styles.counter}>{index + 1} / {notices.length}</span>
            <button className={styles.arrow} onClick={() => setIndex((i) => (i + 1) % notices.length)}>›</button>
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
