import CategoryTabs from '@/components/shop/CategoryTabs/CategoryTabs';
import ProductGrid from '@/components/shop/ProductGrid/ProductGrid';
import styles from './home.module.scss';

export default function HomePage() {
    return (
        <div className={styles.homePage}>
            <section className={styles.categorySection}>
                <CategoryTabs />
            </section>
            <section className={styles.productSection}>
                <ProductGrid />
            </section>
        </div>
    );
}