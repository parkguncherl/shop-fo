'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CartIcon from '@/components/shop/CartIcon/CartIcon';
import HamburgerDrawer from '@/components/common/HamburgerDrawer/HamburgerDrawer';
import styles from './Header.module.scss';

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setSearchValue('');
    }
  };

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          {/* 로고 */}
          <Link href="/" className={styles.logo}>
            GGUANGGU<span className={styles.logoDomain}>.COM</span>
          </Link>

          {/* 우측 액션 */}
          <div className={styles.actions}>
            <CartIcon />

            <button className={styles.iconBtn} onClick={() => setSearchOpen((v) => !v)} aria-label="검색">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* 햄버거 → 드로어 오픈 */}
            <button className={styles.iconBtn} onClick={() => setDrawerOpen(true)} aria-label="메뉴 열기" aria-expanded={drawerOpen}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* 검색바 */}
        {searchOpen && (
          <div className={styles.searchBar}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                autoFocus
                className={styles.searchInput}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="상품명을 검색하세요"
              />
              <button type="submit" className={styles.searchSubmit} aria-label="검색 실행">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </header>

      {/* 햄버거 드로어 */}
      <HamburgerDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
