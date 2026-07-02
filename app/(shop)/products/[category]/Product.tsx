'use client';

import styles from '@/app/(shop)/page.module.scss';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useReducer, useState } from 'react';
import Link from 'next/link';
import { ProductRequestProductInfoListFilter, ProductResponseProductInfo } from '@/generated';
import publicApi from '@/libs/publicApi';
import useFilters from '@/hooks/useFilters';
import { useProductStore } from '@/stores/useProductStore';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { useBlockStore } from '@/stores/useBlockStore';
import useUpdateEffect from '@/customHook/useUpdateEffect';
import { usePageViewLog } from '@/hooks/usePageViewLog';

interface ExtendedProductResponseProductInfo extends ProductResponseProductInfo {
  src?: string;
}

interface ProductInfoState {
  productInfoList: ExtendedProductResponseProductInfo[];
  lastInfo: ProductResponseProductInfo | undefined;
  endOfThePageHasBeenReached: boolean;
}
type ProductInfoAction =
  | {
      type: 'extend';
      payload: {
        infosForExtend: ExtendedProductResponseProductInfo[];
      };
    }
  | {
      type: 'initialize';
      payload: {
        infosForInitialize: ExtendedProductResponseProductInfo[];
      };
    }
  | {
      type: 'sync_lastInfo';
      payload: {
        lastInfo: ProductResponseProductInfo;
      };
    };
function ProductInfosOfHomePageForEnumReducerFn(state: ProductInfoState, action: ProductInfoAction): ProductInfoState {
  if (action.type == 'extend') {
    return {
      ...state,
      productInfoList: state.productInfoList.concat(action.payload.infosForExtend), // concat 은 새 배열을 반환하니 불변성 보장
    };
  }

  if (action.type == 'initialize') {
    return {
      ...state,
      productInfoList: action.payload.infosForInitialize,
    };
  }

  if (action.type == 'sync_lastInfo') {
    return {
      ...state,
      lastInfo: action.payload.lastInfo,
      endOfThePageHasBeenReached: action.payload.lastInfo == undefined,
    };
  }

  return state;
}

/** 상품 - 카테고리 (조건부) 페이지 */
const Product = (Props: { categoryId: string }) => {
  /** 홈페이지 전역 스토어 - State */
  usePageViewLog({ pageType: 'Product', categoryCd: Props.categoryId });
  const [pagingOnProduct, setPagingOnProduct] = useProductStore((s) => [s.paging, s.setPaging]);
  const [getFileUrl] = useWebCommonStore((s) => [s.getFileUrl]);
  const [isBlocked, timeLeft] = useBlockStore((s) => [s.isBlocked, s.timeLeft]);
  const categoryReady = usePartnerCodeStore((s) => s.categoryReady);
  const [sort, setSort] = useState<string>('');

  /** filters, lastInfo's filters*/
  const [lastInfoFilters, onChangeLastInfoFilters, onLastInfoFiltersReset] = useFilters<ProductRequestProductInfoListFilter>({
    lastId: undefined,
    categoryId: Props.categoryId,
  });

  /** 이하 지역 상태는 반드시 배열의 불변성을 유지할 것 */
  const [productInfoListStatus, dispatchProductInfoListStatus] = useReducer(ProductInfosOfHomePageForEnumReducerFn, {
    productInfoList: [],
    lastInfo: undefined,
    endOfThePageHasBeenReached: false,
  });

  /** 페이지 언마운트 시점 초기화 영역 */
  useEffect(() => {
    return () => {
      onLastInfoFiltersReset();
    };
  }, [onLastInfoFiltersReset]);

  /** 정렬 변경 시 목록 초기화 */
  useEffect(() => {
    onChangeLastInfoFilters('lastId', undefined);
    dispatchProductInfoListStatus({ type: 'initialize', payload: { infosForInitialize: [] } });
  }, [sort]);

  /** 품목정보 목록 조회 */
  const {
    data: productInfoList,
    isSuccess: isProductInfoListSuccess,
    // isLoading: isProductInfoListLoading,
    // refetch: productInfoListRefetch,
  } = useQuery({
    queryKey: ['/frontWeb/product/productInfoListPaging', lastInfoFilters.lastId, sort],
    queryFn: () =>
      // 인증 토큰 불필요
      publicApi.get('/frontWeb/product/productInfoListPaging', {
        params: {
          pageRowCount: pagingOnProduct.pageRowCount,
          ...lastInfoFilters,
          ...(sort ? { sort } : {}),
        },
      }),
    refetchOnMount: 'always',
    //gcTime: 0, // 데이터가 비활성화되는 즉시(언마운트) 가비지 컬렉션(삭제) 수행
    enabled: categoryReady, // 카테고리 로드 완료 후 호출
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

  useUpdateEffect(() => {
    if (isProductInfoListSuccess) {
      const { resultCode, body, resultMessage } = productInfoList.data;
      if (resultCode === 200) {
        const productResponseProductInfoList = body.rows || [];
        const productResponseProductInfoListForAttachment: ProductResponseProductInfo[] = pagingOnProduct.pageRowCount
          ? productResponseProductInfoList.slice(0, pagingOnProduct.pageRowCount)
          : productResponseProductInfoList;

        if (pagingOnProduct.pageRowCount) {
          dispatchProductInfoListStatus({
            type: 'sync_lastInfo',
            payload: {
              lastInfo: productResponseProductInfoList[pagingOnProduct.pageRowCount],
            },
          });
        }

        attachImgSrcForEachContents(productResponseProductInfoListForAttachment).then((extendedContentsResponseContentsInfoList) => {
          if (lastInfoFilters.lastId || productInfoListStatus.productInfoList.length == 0) {
            // lastInfoFilters 하에서 lastId가 정의되었거나 contentsInfoListStatus.contentsInfoList 가 빈 배열인(초기화 후 최초 시점 동기화) 경우
            dispatchProductInfoListStatus({
              type: 'extend',
              payload: {
                infosForExtend: extendedContentsResponseContentsInfoList,
              },
            });
          } else {
            // 그 이외에는 기존 확장된 배열을 payload 이하 전달된 배열로 교체토록 dispatch
            dispatchProductInfoListStatus({
              type: 'initialize',
              payload: {
                infosForInitialize: extendedContentsResponseContentsInfoList,
              },
            });
          }
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
        {!isBlocked ? (
          <div>
            <span className={styles.pageTitle}>전체</span>
            <span className={styles.totalCount}>({productInfoListStatus.productInfoList.length})</span>
          </div>
        ) : (
          <div>
            <span>동기화 시점까지 {timeLeft} 초</span>
          </div>
        )}
        <div className={styles.sortWrap}>
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="">신상품순</option>
            <option value="PRICE_ASC">낮은 가격순</option>
            <option value="PRICE_DESC">높은 가격순</option>
            <option value="POPULAR">인기순</option>
          </select>
          <span className={styles.sortArrow}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>

      {/* 2컬럼 그리드 */}
      <div className={styles.grid}>
        {productInfoListStatus.productInfoList.map((product, index) => (
          <div key={index} className={styles.card}>
            {/* 이미지 + 찜하기 — 이미지 영역만 Link로 감쌈 */}
            <div className={styles.imageWrap}>
              <Link href={`/products/${Props.categoryId}/${product.id}`} className={styles.imageLink}>
                {product.src ? (
                  <img src={product.src} alt={product.prodNm} className={styles.image} />
                ) : (
                  <div title={product.prodNm} className={`${styles.image} ${styles.defaultImg}`} />
                )}
              </Link>
            </div>
            {/* 상품 정보도 Link */}
            <Link href={`/products/${Props.categoryId}/${product.id}`} className={styles.info}>
              <p className={styles.name}>{product.prodNm}</p>
              <div className={styles.priceRow}>
                {product.discountRate && product.discountRate != 0 && <span className={styles.discount}>{Math.round(product.discountRate || 0)}%</span>}
                <span className={styles.price}>
                  {((product.sellAmt || 0) - Math.floor((product.sellAmt || 0) * ((product.discountRate || 0) / 100))).toLocaleString()}원
                </span>
                {product.sellAmt && product.discountRate && product.discountRate != 0 && (
                  <span className={styles.originalPrice}>{product.sellAmt.toLocaleString()}원</span>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
      <div className={styles.paging}>
        <button
          className={styles.pagingBtn}
          disabled={productInfoListStatus.endOfThePageHasBeenReached}
          onClick={() => {
            // 클릭 시점에 lastId 동기화하여 refetch 촉발
            onChangeLastInfoFilters('lastId', productInfoListStatus.productInfoList[productInfoListStatus.productInfoList.length - 1].id);
          }}
        >
          {productInfoListStatus.endOfThePageHasBeenReached ? '사용할 수 없음' : '눌러서 다음 페이지로 확장'}
        </button>
      </div>
    </div>
  );
};

export default Product;
