'use client';

import styles from '@/app/(shop)/page.module.scss';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ProductRequestProductInfoListFilter, ProductResponseProductInfo } from '@/generated';
import publicApi from '@/libs/publicApi';
import useFilters from '@/hooks/useFilters';
import { useProductStore } from '@/stores/useProductStore';
//import { Contents as ContentsRegExps } from '@/libs/const';
import { useWebCommonStore } from '@/stores/useWebCommonStore';

interface ExtendedProductResponseProductInfo extends ProductResponseProductInfo {
  src?: string;
}

/** 상품 - 카테고리 (조건부) 페이지 */
const Product = () => {
  /** 홈페이지 전역 스토어 - State */
  const [pagingOnProduct, setPagingOnProduct] = useProductStore((s) => [s.paging, s.setPaging]);
  const [getFileUrl] = useWebCommonStore((s) => [s.getFileUrl]);

  /** filters, lastInfo's filters*/
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ProductRequestProductInfoListFilter>({
    lastId: undefined,
  });

  const [productResponseProductInfoList, setProductResponseProductInfoList] = useState<ExtendedProductResponseProductInfo[]>([]);

  /** 품목정보 목록 조회 */
  const {
    data: productInfoList,
    isSuccess: isProductInfoListSuccess,
    isLoading: isProductInfoListLoading,
    refetch: productInfoListRefetch,
  } = useQuery({
    queryKey: ['/frontWeb/product/productInfoListPaging'],
    queryFn: () =>
      // 인증 토큰 불필요
      publicApi.get('/frontWeb/product/productInfoListPaging', {
        params: {
          curPage: pagingOnProduct.curPage,
          pageRowCount: pagingOnProduct.pageRowCount,
          ...filters,
        },
      }),
    refetchOnMount: 'always',
  });

  // 컨텐츠 각각에 img src 첨부
  const attachImgSrcForEachContents = async (productInfos: ExtendedProductResponseProductInfo[]) => {
    const extendedProductResponseProductInfoList: ExtendedProductResponseProductInfo[] = [];
    for (let i = 0; i < productInfos.length; i++) {
      extendedProductResponseProductInfoList.push({
        ...productInfos[i],
        src: productInfos[i].sysFileNm ? await getFileUrl(productInfos[i].sysFileNm as string) : undefined,
      });
    }

    return extendedProductResponseProductInfoList;
  };

  useEffect(() => {
    if (isProductInfoListSuccess) {
      const { resultCode, body, resultMessage } = productInfoList.data;
      if (resultCode === 200) {
        attachImgSrcForEachContents(body.rows || []).then((extendedContentsResponseContentsInfoList) => {
          setProductResponseProductInfoList(extendedContentsResponseContentsInfoList);
        });
      } else {
        console.error(resultMessage);
      }
    }
  }, [productInfoList, isProductInfoListSuccess]);

  return (
    <div className={styles.page}>
      {/* 필터 행 */}
      <div className={styles.filterRow}>
        <div>
          <span className={styles.pageTitle}>전체</span>
          <span className={styles.totalCount}>({productResponseProductInfoList.length})</span>
        </div>
        <div>
          <button className={styles.sortBtn}>상품정렬 ▽</button>
        </div>
      </div>

      {/* 2컬럼 그리드 */}
      <div className={styles.grid}>
        {productResponseProductInfoList.map((product, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.imageWrap}>
              {product.src ? (
                <img src={product.src} alt={product.prodNm} className={styles.image} />
              ) : (
                <div title={product.prodNm} className={`${styles.image} ${styles.defaultImg}`} />
              )}
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
              <p className={styles.name}>{product.prodNm}</p>
              <div className={styles.priceRow}>
                {product.discountRate && product.discountRate != 0 && <span className={styles.discount}>{Math.round(product.discountRate || 0)}%</span>}
                <span className={styles.price}>
                  {((product.sellAmt || 0) - (product.sellAmt || 0) * Math.round(product.discountRate || 0)).toLocaleString()}원
                </span>
                {product.sellAmt && product.discountRate && product.discountRate != 0 && (
                  <span className={styles.originalPrice}>{product.sellAmt.toLocaleString()}원</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Product;
