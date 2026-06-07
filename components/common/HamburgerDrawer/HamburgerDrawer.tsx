'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useCartStore } from '@/stores/cartStore';
import styles from './HamburgerDrawer.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_GROUPS = [
  {
    title: '마이페이지',
    items: [
      { label: '주문내역',   href: '/mypage/orders' },
      { label: '장바구니',   href: '/cart' },
      { label: '최근본상품', href: '/mypage/recent' },
    ],
  },
  {
    title: '고객센터',
    items: [
      { label: '배송문의',     href: '/cs/delivery' },
      { label: '상품문의',     href: '/cs/product' },
      { label: '취소변경내역', href: '/cs/cancel' },
      { label: '나의리뷰',     href: '/cs/review' },
    ],
  },
];

export default function HamburgerDrawer({ isOpen, onClose }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const cartCount = useCartStore((s) => s.totalCount());

  // 드로어 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    onClose();
    router.push('/');
  };

  return (
    <>
      {/* 딤 배경 */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 드로어 패널 */}
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`} aria-label="메뉴">

        {/* 상단: 카트 / 검색 / 닫기 */}
        <div className={styles.topBar}>
          <Link href="/cart" className={styles.topIcon} onClick={onClose} aria-label="장바구니">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 3h2l2.4 10h9.2l1.8-7H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="19" r="1" fill="currentColor"/>
              <circle cx="17" cy="19" r="1" fill="currentColor"/>
            </svg>
            {cartCount > 0 && (
              <span className={styles.badge}>{cartCount > 9 ? '9+' : cartCount}</span>
            )}
          </Link>

          <Link href="/search" className={styles.topIcon} onClick={onClose} aria-label="검색">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M15 15l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </Link>

          <button className={styles.topIcon} onClick={onClose} aria-label="닫기">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 로그인 상태에 따른 유저 영역 */}
        <div className={styles.userArea}>
          {session ? (
            <div className={styles.loggedIn}>
              <p className={styles.userName}>
                <strong>{session.user?.name ?? '회원'}</strong>님 안녕하세요 👋
              </p>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link href="/login" className={styles.loginBtn} onClick={onClose}>
                로그인
              </Link>
              <Link href="/signup" className={styles.signupBtn} onClick={onClose}>
                회원가입
              </Link>
            </div>
          )}
        </div>

        {/* 메뉴 그룹 */}
        <nav className={styles.nav}>
          {MENU_GROUPS.map((group) => (
            <div key={group.title} className={styles.group}>
              <p className={styles.groupTitle}>{group.title}</p>
              <ul className={styles.groupList}>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.menuItem} onClick={onClose}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
