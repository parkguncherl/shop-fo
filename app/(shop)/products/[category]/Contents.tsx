'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useReducer } from 'react';
import { ContentsRequestContentsInfoListFilter, ContentsResponseContentsInfo } from '@/generated';
import publicApi from '@/libs/publicApi';
import useFilters from '@/hooks/useFilters';
import { useContentsStore } from '@/stores/useContentsStore';
//import { Contents as ContentsRegExps } from '../../../../libs/const';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import styles from '@/app/(shop)/page.module.scss';

interface ExtendedContentsResponseContentsInfo extends ContentsResponseContentsInfo {
  src?: string;
}

interface ContentsInfosState {
  contentsInfoList: ExtendedContentsResponseContentsInfo[];
  lastInfo: ContentsResponseContentsInfo | undefined;
  endOfThePageHasBeenReached: boolean;
}
type ContentsInfosAction =
  | {
      type: 'extend';
      payload: {
        infosForExtend: ExtendedContentsResponseContentsInfo[];
      };
    }
  | {
      type: 'initialize';
      payload: {
        infosForInitialize: ExtendedContentsResponseContentsInfo[];
      };
    }
  | {
      type: 'sync_lastInfo';
      payload: {
        lastInfo: ContentsResponseContentsInfo;
      };
    };

function ContentsInfosManagementReducerFn(state: ContentsInfosState, action: ContentsInfosAction): ContentsInfosState {
  if (action.type == 'extend') {
    return {
      ...state,
      contentsInfoList: state.contentsInfoList.concat(action.payload.infosForExtend), // concat 은 새 배열을 반환하니 불변성 보장
    };
  }

  if (action.type == 'initialize') {
    return {
      ...state,
      contentsInfoList: action.payload.infosForInitialize,
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
const Contents = () => {
  /** 홈페이지 전역 스토어 - State */
  const [pagingOnContents] = useContentsStore((s) => [s.paging]);
  const [getFileUrl] = useWebCommonStore((s) => [s.getFileUrl]);

  /** filters, lastInfo's filters*/
  const [lastInfoFilters, onChangeLastInfoFilters, onLastInfoFiltersReset] = useFilters<ContentsRequestContentsInfoListFilter>({
    lastId: undefined,
  });

  /** 이하 지역 상태는 반드시 배열의 불변성을 유지할 것 */
  const [contentsInfoListStatus, dispatchContentsInfoListStatus] = useReducer(ContentsInfosManagementReducerFn, {
    contentsInfoList: [],
    lastInfo: undefined,
    endOfThePageHasBeenReached: false,
  });

  //const [endOfThePageHasBeenReached, setEndOfThePageHasBeenReached] = useState(false);

  /** 품목정보 목록 조회 */
  const {
    data: contentsInfoList,
    isSuccess: isContentsInfoListSuccess,
    isLoading: isContentsInfoListLoading,
    refetch: contentsInfoListRefetch,
  } = useQuery({
    queryKey: ['/frontWeb/contents/contentsInfoListPaging', lastInfoFilters.lastId],
    queryFn: () =>
      // 인증 토큰 불필요
      publicApi.get('/frontWeb/contents/contentsInfoListPaging', {
        params: {
          //curPage: pagingOnContents.curPage,
          pageRowCount: pagingOnContents.pageRowCount,
          ...lastInfoFilters,
        },
      }),
    refetchOnMount: 'always',
  });

  // 오리지널 newsContents 기반으로 이미지 토큰 제거하고 캐리지 리턴 기준으로 분할
  // const contentRenderer = (newsContents?: string) => {
  //   return newsContents
  //     ? (newsContents.length > 320 ? newsContents.substring(0, 320) + '...' : newsContents)
  //         .replace(ContentsRegExps.imgToken, '')
  //         .split(ContentsRegExps.carriageReturn)
  //     : [];
  // };

  // 컨텐츠 각각에 img src 첨부
  const attachImgSrcForEachContents = async (contentInfos: ContentsResponseContentsInfo[]) => {
    const extendedContentsResponseContentsInfoList: ExtendedContentsResponseContentsInfo[] = [];
    for (let i = 0; i < contentInfos.length; i++) {
      extendedContentsResponseContentsInfoList.push({
        ...contentInfos[i],
        src: contentInfos[i].sysFileNm ? await getFileUrl(contentInfos[i].sysFileNm as string) : undefined,
      });
    }

    return extendedContentsResponseContentsInfoList;
  };

  useEffect(() => {
    if (isContentsInfoListSuccess) {
      const { resultCode, body, resultMessage } = contentsInfoList.data;
      if (resultCode === 200) {
        const contentsInfoList = body.rows || [];
        const contentsInfoListForAttachment: ContentsResponseContentsInfo[] = pagingOnContents.pageRowCount
          ? contentsInfoList.slice(0, pagingOnContents.pageRowCount)
          : contentsInfoList;

        if (pagingOnContents.pageRowCount) {
          dispatchContentsInfoListStatus({
            type: 'sync_lastInfo',
            payload: {
              lastInfo: contentsInfoList[pagingOnContents.pageRowCount],
            },
          });
        }

        attachImgSrcForEachContents(contentsInfoListForAttachment).then((extendedContentsResponseContentsInfoList) => {
          if (lastInfoFilters.lastId || contentsInfoListStatus.contentsInfoList.length == 0) {
            // lastInfoFilters 하에서 lastId가 정의되었거나 contentsInfoListStatus.contentsInfoList 가 빈 배열인(초기화 후 최초 시점 동기화) 경우
            dispatchContentsInfoListStatus({
              type: 'extend',
              payload: {
                infosForExtend: extendedContentsResponseContentsInfoList,
              },
            });
          } else {
            // 그 이외에는 기존 확장된 배열을 payload 이하 전달된 배열로 교체토록 dispatch
            dispatchContentsInfoListStatus({
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
  }, [contentsInfoList, isContentsInfoListSuccess]);

  return (
    <div className={styles.page}>
      {/* 필터 행 */}
      <div className={styles.filterRow}>
        <div>
          <span className={styles.pageTitle}>전체</span>
          <span className={styles.totalCount}>({contentsInfoListStatus.contentsInfoList.length})</span>
        </div>
        <div>
          <button className={styles.sortBtn}>컨텐츠 정렬 ▽</button>
        </div>
      </div>

      {/* 2컬럼 그리드 */}
      <div className={styles.grid}>
        {contentsInfoListStatus.contentsInfoList.map((product, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.imageWrap}>
              {product.src ? (
                <img src={product.src} alt={product.newsSubTitle} className={styles.image} />
              ) : (
                <div title={product.newsSubTitle} className={`${styles.image} ${styles.defaultImg}`} />
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
              <p className={styles.name}>{product.newsTitle}</p>
              <p className={styles.subTitle}>{product.newsSubTitle}</p>
              {/*<div className={styles.contentRow}>*/}
              {/*  <span className={styles.content}>*/}
              {/*    {contentRenderer(product.newsContents).map((line, index, array) => (*/}
              {/*      <Fragment key={index}>*/}
              {/*        {line}*/}
              {/*        {index < array.length - 1 && <br />}*/}
              {/*      </Fragment>*/}
              {/*    ))}*/}
              {/*  </span>*/}
              {/*</div>*/}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.paging}>
        <button
          className={styles.pagingBtn}
          disabled={contentsInfoListStatus.endOfThePageHasBeenReached}
          onClick={() => {
            // 클릭 시점에 lastId 동기화하여 refetch 촉발
            onChangeLastInfoFilters('lastId', contentsInfoListStatus.contentsInfoList[contentsInfoListStatus.contentsInfoList.length - 1].id);
          }}
        >
          {contentsInfoListStatus.endOfThePageHasBeenReached ? '사용할 수 없음' : '눌러서 다음 페이지로 확장'}
        </button>
      </div>
    </div>
  );
};

export default Contents;
