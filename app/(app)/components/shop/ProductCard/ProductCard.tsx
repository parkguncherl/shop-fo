'use client';
import Image from 'next/image';
import Link from 'next/link';
import WishlistBtn from '@/components/shop/WishlistBtn/WishlistBtn';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    badge?: string;
}

export default function ProductCard({
                                        id, name, price, originalPrice, imageUrl, badge
                                    }: ProductCardProps) {
    const discount = originalPrice
        ? Math.round((1 - price / originalPrice) * 100)
        : null;

    return (
        <div className={styles.card}>
            <Link href={`/product/${id}`} className={styles.imageWrap}>
                <Image src={imageUrl} alt={name} fill sizes="(max-width: 768px) 50vw, 25vw" />
                {badge && <span className={styles.badge}>{badge}</span>}
                <WishlistBtn productId={id} className={styles.wishlistBtn} />
            </Link>
            <div className={styles.info}>
                <p className={styles.name}>{name}</p>
                <div className={styles.priceRow}>
                    {discount && <span className={styles.discount}>{discount}%</span>}
                    <span className={styles.price}>{price.toLocaleString()}원</span>
                    {originalPrice && (
                        <span className={styles.originalPrice}>
              {originalPrice.toLocaleString()}원
            </span>
                    )}
                </div>
            </div>
        </div>
    );
}