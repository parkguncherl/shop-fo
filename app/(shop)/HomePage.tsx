'use client';

import styles from '@/app/(shop)/page.module.scss';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useReducer, useState } from 'react';
import { useHomePageStore } from '@/stores/useHomePageStore';
import useFilters from '../../hooks/useFilters';
import { ContentsResponseContentsInfo, DisplayRequestProductDetInfoListFilter, DisplayResponseProductInfoForEnum } from '@/generated';
import publicApi from '@/libs/publicApi';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { usePageViewLog } from '@/hooks/usePageViewLog';
import { useBlockStore } from '@/stores/useBlockStore';
import useUpdateEffect from '@/customHook/useUpdateEffect';
import { useUiStore } from '@/stores/uiStore';

interface ExtendedDisplayResponseProductInfoForEnum extends DisplayResponseProductInfoForEnum {
  src?: string;
}

interface ProductInfosOfHomePageForEnumState {
  productInfosForEnum: ExtendedDisplayResponseProductInfoForEnum[];
  lastInfo: DisplayResponseProductInfoForEnum | undefined;
  endOfThePageHasBeenReached: boolean;
}
type ProductInfosOfHomePageForEnumAction =
  | {
      type: 'extend';
      payload: {
        infosForExtend: ExtendedDisplayResponseProductInfoForEnum[];
      };
    }
  | {
      type: 'initialize';
      payload: {
        infosForInitialize: ExtendedDisplayResponseProductInfoForEnum[];
      };
    }
  | {
      type: 'sync_lastInfo';
      payload: {
        lastInfo: ContentsResponseContentsInfo;
      };
    };
function ProductInfosOfHomePageForEnumReducerFn(
  state: ProductInfosOfHomePageForEnumState,
  action: ProductInfosOfHomePageForEnumAction,
): ProductInfosOfHomePageForEnumState {
  if (action.type == 'extend') {
    return {
      ...state,
      productInfosForEnum: state.productInfosForEnum.concat(action.payload.infosForExtend), // concat 은 새 배열을 반환하니 불변성 보장
    };
  }

  if (action.type == 'initialize') {
    return {
      ...state,
      productInfosForEnum: action.payload.infosForInitialize,
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

/** 상품관리 - 상품컨텐츠 페이지 */
const HomePage = () => {
  const guestReady = useUiStore((s) => s.guestReady);
  usePageViewLog({ pageType: 'main' });
  /** 홈페이지 전역 스토어 - State */
  const [paging] = useHomePageStore((s) => [s.paging]);
  const [getFileUrl] = useWebCommonStore((s) => [s.getFileUrl]);
  //  const [isBlocked, timeLeft] = useBlockStore((s) => [s.isBlocked, s.timeLeft]);
  /** filters, lastInfo's filters*/
  const [lastInfoFilters, onChangeLastInfoFilters, onLastInfoFiltersReset] = useFilters<DisplayRequestProductDetInfoListFilter>({
    lastProdId: undefined,
  });

  /** 이하 지역 상태는 반드시 배열의 불변성을 유지할 것 */
  const [productInfoListOfHomePageStatus, dispatchProductInfoListOfHomePageStatus] = useReducer(ProductInfosOfHomePageForEnumReducerFn, {
    productInfosForEnum: [],
    lastInfo: undefined,
    endOfThePageHasBeenReached: false,
  });

  /** 페이지 언마운트 시점 초기화 영역 */
  useEffect(() => {
    return () => {
      onLastInfoFiltersReset();
    };
  }, [onLastInfoFiltersReset]);

  /** 품목정보 목록 조회 */
  const { data: productInfoListForEnum, isSuccess: isProductInfoListForEnumSuccess } = useQuery({
    queryKey: ['/frontWeb/display/productInfoListForEnum', lastInfoFilters.lastProdId, guestReady],
    queryFn: () =>
      // 인증 토큰 불필요
      publicApi.get('/frontWeb/display/productInfoListForEnum', {
        params: {
          //curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...lastInfoFilters,
        },
      }),
    refetchOnMount: 'always',
    enabled: guestReady, // ← Guest Token 발급 후에만 호출, 또한 차단 상태가 아닐 때(!isBlocked)
  });

  const syncProductInfosWithImgSrcs = async (ListForEnum: DisplayResponseProductInfoForEnum[]) => {
    const extendedDisplayResponseProductInfoListForEnum: ExtendedDisplayResponseProductInfoForEnum[] = [];
    for (let i = 0; i < ListForEnum.length; i++) {
      extendedDisplayResponseProductInfoListForEnum.push({
        ...ListForEnum[i],
        src: ListForEnum[i].sysFileNm ? await getFileUrl(ListForEnum[i].sysFileNm as string) : undefined,
      });
    }

    return extendedDisplayResponseProductInfoListForEnum;
  };

  useUpdateEffect(() => {
    if (isProductInfoListForEnumSuccess) {
      const { resultCode, body, resultMessage } = productInfoListForEnum.data;
      if (resultCode === 200) {
        const productInfoListForEnum = body.rows || [];
        const productInfoListForEnumForAttachment: DisplayResponseProductInfoForEnum[] = paging.pageRowCount
          ? productInfoListForEnum.slice(0, paging.pageRowCount)
          : productInfoListForEnum;

        if (paging.pageRowCount) {
          dispatchProductInfoListOfHomePageStatus({
            type: 'sync_lastInfo',
            payload: {
              lastInfo: productInfoListForEnum[paging.pageRowCount],
            },
          });
        }

        syncProductInfosWithImgSrcs(productInfoListForEnumForAttachment).then((ResponseProductInfoListForEnum) => {
          if (lastInfoFilters.lastProdId || productInfoListOfHomePageStatus.productInfosForEnum.length == 0) {
            // lastInfoFilters 하에서 lastId가 정의되었거나 contentsInfoListStatus.contentsInfoList 가 빈 배열인(초기화 후 최초 시점 동기화) 경우
            dispatchProductInfoListOfHomePageStatus({
              type: 'extend',
              payload: {
                infosForExtend: ResponseProductInfoListForEnum,
              },
            });
          } else {
            // 그 이외에는 기존 확장된 배열을 payload 이하 전달된 배열로 교체토록 dispatch
            dispatchProductInfoListOfHomePageStatus({
              type: 'initialize',
              payload: {
                infosForInitialize: ResponseProductInfoListForEnum,
              },
            });
          }
        });
      } else {
        console.error(resultMessage);
      }
    }
  }, [productInfoListForEnum, isProductInfoListForEnumSuccess]);

  return (
    <div className={styles.page}>
      {/* 필터 행 */}
      <div className={styles.filterRow}>
        <div>
          <span className={styles.pageTitle}>베스트셀러</span>
          <span className={styles.totalCount}>({productInfoListOfHomePageStatus.productInfosForEnum.length})</span>
        </div>
        <div>
          <button className={styles.sortBtn}>상품정렬 ▽</button>
        </div>
      </div>

      {/* 2컬럼 그리드 */}
      <div className={styles.grid}>
        {productInfoListOfHomePageStatus.productInfosForEnum.map((product, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.imageWrap}>
              {product.src ? (
                <img src={product.src} alt={product.prodNm} className={styles.image} />
              ) : (
                <div title={product.prodNm} className={`${styles.image} ${styles.defaultImg}`} />
              )}
              {/*{product.badge && <span className={`${styles.badge} ${styles[product.badge]}`}>{product.badge.toUpperCase()}</span>}*/}
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
      <div className={styles.paging}>
        <button
          className={styles.pagingBtn}
          disabled={productInfoListOfHomePageStatus.endOfThePageHasBeenReached}
          onClick={() => {
            // 클릭 시점에 lastId 동기화하여 refetch 촉발
            onChangeLastInfoFilters(
              'lastProdId',
              productInfoListOfHomePageStatus.productInfosForEnum[productInfoListOfHomePageStatus.productInfosForEnum.length - 1].prodId,
            );
          }}
        >
          {productInfoListOfHomePageStatus.endOfThePageHasBeenReached ? '사용할 수 없음' : '눌러서 다음 페이지로 확장'}
        </button>
      </div>
    </div>
  );
};

export default HomePage;
