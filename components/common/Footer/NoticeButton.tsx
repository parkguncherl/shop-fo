'use client';

import { useWebCommonStore } from '@/stores/useWebCommonStore';
import styles from './Footer.module.scss';

export default function NoticeButton() {
  const showNotice = useWebCommonStore((s) => s.showNotice);
  return (
    <button className={styles.noticeBtn} onClick={showNotice}>공지</button>
  );
}
