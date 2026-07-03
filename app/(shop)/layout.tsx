import Header from '@/components/common/Header/Header';
import Navigation from '@/components/common/Navigation/Navigation';
import Footer from '@/components/common/Footer/Footer';
import MobileNav from '@/components/layout/MobileNav/MobileNav';
import ScrollTop from '@/components/layout/ScrollTop/ScrollTop';
import styles from './layout.module.scss';
import GuestTokenInit from '@/components/common/GuestTokenInit/GuestTokenInit';
import NoticePopup from '@/components/common/NoticePopup/NoticePopup';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <GuestTokenInit /> {/* 토큰 useEffect 실행을위한 더미 */}
      <NoticePopup />
      <Header />
      <Navigation />
      <main className={styles.main}>{children}</main>
      <Footer />
      <MobileNav />
      <ScrollTop />
    </div>
  );
}
