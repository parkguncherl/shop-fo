'use client';

import { useQuery } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';
import { ContentsRequestContentsInfoListFilter, ContentsResponseContentsInfo } from '@/generated';
import publicApi from '@/libs/publicApi';
import useFilters from '@/hooks/useFilters';
import { useContentsStore } from '@/stores/useContentsStore';
import { Contents as ContentsRegExps } from '../../../../libs/const';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import styles from '@/app/(shop)/page.module.scss';

interface ExtendedContentsResponseContentsInfo extends ContentsResponseContentsInfo {
  src?: string;
}

/** 상품 - 카테고리 (조건부) 페이지 */
const Contents = () => {
  /** 홈페이지 전역 스토어 - State */
  const [pagingOnContents, setPagingOnContents] = useContentsStore((s) => [s.paging, s.setPaging]);
  const [getFileUrl] = useWebCommonStore((s) => [s.getFileUrl]);

  /** filters, lastInfo's filters*/
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ContentsRequestContentsInfoListFilter>({
    lastId: undefined,
  });

  const [contentsResponseContentsInfoList, setContentsResponseContentsInfoList] = useState<ExtendedContentsResponseContentsInfo[]>([]);

  /** 품목정보 목록 조회 */
  const {
    data: contentsInfoList,
    isSuccess: isContentsInfoListSuccess,
    isLoading: isContentsInfoListLoading,
    refetch: contentsInfoListRefetch,
  } = useQuery({
    queryKey: ['/frontWeb/contents/contentsInfoListPaging', pagingOnContents.curPage],
    queryFn: () =>
      // 인증 토큰 불필요
      publicApi.get('/frontWeb/contents/contentsInfoListPaging', {
        params: {
          curPage: pagingOnContents.curPage,
          pageRowCount: pagingOnContents.pageRowCount,
          ...filters,
        },
      }),
    refetchOnMount: 'always',
  });

  // 오리지널 newsContents 기반으로 이미지 토큰 제거하고 캐리지 리턴 기준으로 분할
  const contentRenderer = (newsContents?: string) => {
    return newsContents
      ? (newsContents.length > 320 ? newsContents.substring(0, 320) + '...' : newsContents)
          .replace(ContentsRegExps.imgToken, '')
          .split(ContentsRegExps.carriageReturn)
      : [];
  };

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
        // todo 페이징 동작에 맞추어 setState 동작을 적절히 처리하거나 reducer 를 통한 디스패칭 형식 재정의를 고려하여야
        attachImgSrcForEachContents(body.rows || []).then((extendedContentsResponseContentsInfoList) => {
          setContentsResponseContentsInfoList(extendedContentsResponseContentsInfoList);
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
          <span className={styles.totalCount}>({contentsResponseContentsInfoList.length})</span>
        </div>
        <div>
          <button className={styles.sortBtn}>컨텐츠 정렬 ▽</button>
        </div>
      </div>

      {/* 2컬럼 그리드 */}
      <div className={styles.grid}>
        {contentsResponseContentsInfoList.map((product, index) => (
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
        <button className={styles.pagingBtn} disabled={!pagingOnContents.curPage}>
          {pagingOnContents.curPage ? '눌러서 ' + (pagingOnContents.curPage + 1) + '페이지로 확장' : '사용할 수 없음'}
        </button>
      </div>
    </div>
  );
};

export default Contents;
