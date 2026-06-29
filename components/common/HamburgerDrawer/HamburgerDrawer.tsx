'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/libs/api';
import { toastError } from '@/components/common/Others/ToastMessage';
import { useConfirm } from '@/components/common/ConfirmModal/ConfirmProvider';
import CartIcon from '@/components/shop/CartIcon/CartIcon';
import styles from './HamburgerDrawer.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_GROUPS = [
  {
    title: '마이페이지',
    items: [
      { label: '주문내역', href: '/mypage/orders' },
      { label: '장바구니', href: '/cart' },
    ],
  },
  {
    title: '고객센터',
    items: [],
  },
];

const CS_GROUP_TITLE = '고객센터';

export default function HamburgerDrawer({ isOpen, onClose }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  // 드로어 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const confirm = useConfirm();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    onClose();
    router.push('/');
  };

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const socialAccountId = (session as any)?.socialAccountId;
      const { data } = await authApi.delete('/frontWeb/login/withdraw', { params: { socialAccountId } });
      if (data?.resultCode !== 200) throw new Error(data?.resultMessage ?? '탈퇴 처리 중 오류가 발생했습니다.');
    },
    onSuccess: async () => {
      await signOut({ callbackUrl: '/' });
    },
    onError: (error: any) => {
      toastError(error?.message ?? '탈퇴 처리 중 오류가 발생했습니다.');
    },
  });

  const handleWithdraw = async () => {
    const ok = await confirm({ message: '정말 탈퇴하시겠습니까?\n탈퇴 시 개인정보가 즉시 삭제되며 복구할 수 없습니다.' });
    if (!ok) return;
    withdrawMutation.mutate();
  };

  return (
    <>
      {/* 딤 배경 */}
      <div className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`} onClick={onClose} aria-hidden="true" />

      {/* 드로어 패널 */}
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`} aria-label="메뉴">
        {/* 상단: 카트 / 검색 / 닫기 */}
        <div className={styles.topBar}>
          <CartIcon className={styles.topIconCart} />

          <Link href="/search" className={styles.topIcon} onClick={onClose} aria-label="검색">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>

          <button className={styles.topIcon} onClick={onClose} aria-label="닫기">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
                {/* 고객센터 그룹 하단에 탈퇴 버튼 — 로그인 상태에서만 */}
                {session && group.title === CS_GROUP_TITLE && (
                  <li>
                    <button className={`${styles.menuItem} ${styles.withdrawBtn}`} onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
                      회원 탈퇴
                    </button>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
