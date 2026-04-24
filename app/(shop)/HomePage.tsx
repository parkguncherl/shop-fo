'use client';

import styles from '@/app/(shop)/page.module.scss';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import axios from 'axios';
import { useHomePageStore } from '@/stores/useHomePageStore';
import useFilters from '../../hooks/useFilters';
import { DisplayRequestProductDetInfoListFilter } from '@/generated';
import publicApi from '@/libs/publicApi';

const DUMMY_PRODUCTS = [
  { id: 1, name: '레이스 스트라이프 가디건 | 브라운', price: 52000, originalPrice: 68000, badge: 'best' },
  { id: 2, name: '레이스 스트라이프 가디건 | 크림', price: 52000, originalPrice: null, badge: 'new' },
  { id: 3, name: '크로셰 스트라이프 탑 | 카멜', price: 39000, originalPrice: 52000, badge: 'sale' },
  { id: 4, name: '크로셰 스트라이프 탑 | 베이지', price: 39000, originalPrice: null, badge: null },
  { id: 5, name: '라운드 넥 니트 가디건 | 그린', price: 44000, originalPrice: 58000, badge: 'best' },
  { id: 6, name: '라운드 넥 니트 가디건 | 블루', price: 44000, originalPrice: null, badge: null },
];

/** 상품관리 - 상품컨텐츠 페이지 */
const HomePage = () => {
  /** 홈페이지 전역 스토어 - State */
  const [paging, setPaging, modals, openModal, closeModal] = useHomePageStore((s) => [s.paging, s.setPaging, s.modals, s.openModal, s.closeModal]);

  /** filters, lastInfo's filters*/
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<DisplayRequestProductDetInfoListFilter>({
    lastProdDetId: undefined,
  });

  /** 품목정보 목록 조회 */
  const {
    data: productInfoListForEnum,
    isSuccess: isProductInfoListForEnumSuccess,
    isLoading: isProductInfoListForEnumLoading,
    refetch: productInfoListForEnumRefetch,
  } = useQuery({
    queryKey: ['/frontWeb/display/productInfoListForEnum'],
    queryFn: () =>
      // 인증 토큰 불필요
      publicApi.get('/frontWeb/display/productInfoListForEnum', {
        params: {
          //curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isProductInfoListForEnumSuccess) {
      const { resultCode, body, resultMessage } = productInfoListForEnum.data;
      if (resultCode === 200) {
        console.log('body: ', body);
      } else {
        console.error(resultMessage);
      }
    }
  }, [productInfoListForEnum, isProductInfoListForEnumSuccess]);

  return (
    <div className={styles.page}>
      {/* 필터 행 */}
      <div className={styles.filterRow}>
        <div className={styles.titleWrap}>
          <span className={styles.pageTitle}>베스트셀러</span>
          <span className={styles.totalCount}>({DUMMY_PRODUCTS.length})</span>
        </div>
        <button className={styles.sortBtn}>상품정렬 ▽</button>
      </div>

      {/* 2컬럼 그리드 */}
      <div className={styles.grid}>
        {DUMMY_PRODUCTS.map((product) => (
          <div key={product.id} className={styles.card}>
            <div className={styles.imageWrap}>
              <img src={`https://picsum.photos/seed/${product.id + 10}/400/500`} alt={product.name} className={styles.image} />
              {product.badge && <span className={`${styles.badge} ${styles[product.badge]}`}>{product.badge.toUpperCase()}</span>}
              <button className={styles.wishBtn} aria-label="찜하기">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <path
                    d="M11 18.5S3 13.5 3 8a5 5 0 019.5-2.2A5 5 0 0119 8c0 5.5-8 10.5-8 10.5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className={styles.info}>
              <p className={styles.name}>{product.name}</p>
              <div className={styles.priceRow}>
                {product.originalPrice && <span className={styles.discount}>{Math.round((1 - product.price / product.originalPrice) * 100)}%</span>}
                <span className={styles.price}>{product.price.toLocaleString()}원</span>
                {product.originalPrice && <span className={styles.originalPrice}>{product.originalPrice.toLocaleString()}원</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
