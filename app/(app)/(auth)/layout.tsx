import Header from '@/components/common/Header/Header';
import Footer from '@/components/common/Footer/Footer';
import MobileNav from '@/components/layout/MobileNav/MobileNav';
import styles from './shop.module.scss';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.shopLayout}>
            <Header />
            <main className={styles.main}>{children}</main>
            <Footer />
            <MobileNav />
        </div>
    );
}