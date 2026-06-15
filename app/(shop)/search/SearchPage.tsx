'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useReducer, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProductResponseProductInfo } from '@/generated';
import publicApi from '@/libs/publicApi';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import styles from '@/app/(shop)/page.module.scss';
import searchStyles from './SearchPage.module.scss';
import useUpdateEffect from '@/customHook/useUpdateEffect';

interface ExtendedProductInfo extends ProductResponseProductInfo {
  src?: string;
}

const PAGE_ROW = 20;

export default function SearchPage({ keyword }: { keyword: string }) {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? keyword;

  const categoryReady = usePartnerCodeStore((s) => s.categoryReady);
  const getFileUrl = useWebCommonStore((s) => s.getFileUrl);

  const [list, setList] = useState<ExtendedProductInfo[]>([]);
  const [lastId, setLastId] = useState<number | undefined>(undefined);
  const [end, setEnd] = useState(false);

  // q가 바뀌면 초기화
  useEffect(() => {
    setList([]);
    setLastId(undefined);
    setEnd(false);
  }, [q]);

  const { data, isSuccess } = useQuery({
    queryKey: ['/frontWeb/product/productSearch', q, lastId],
    queryFn: () =>
      publicApi.get('/frontWeb/product/productSearch', {
        params: { keyword: q, lastId, pageRowCount: PAGE_ROW },
      }),
    enabled: categoryReady && q.trim().length > 0,
  });

  useUpdateEffect(() => {
    if (!isSuccess) return;
    const { resultCode, body } = data.data;
    if (resultCode !== 200) return;

    const rows: ProductResponseProductInfo[] = body.rows ?? [];
    const forDisplay = rows.slice(0, PAGE_ROW);
    const nextItem = rows[PAGE_ROW];

    setEnd(nextItem === undefined);

    Promise.all(
      forDisplay.map(async (p) => ({
        ...p,
        src: p.sysFileNm ? await getFileUrl(p.sysFileNm as string) : undefined,
      })),
    ).then((extended) => {
      setList((prev) => (lastId === undefined ? extended : [...prev, ...extended]));
    });
  }, [data, isSuccess]);

  return (
    <div className={styles.page}>
      <div className={searchStyles.header}>
        <h2 className={searchStyles.title}>
          <span className={searchStyles.keyword}>"{q}"</span> 검색 결과
        </h2>
        <span className={searchStyles.count}>{list.length}개</span>
      </div>

      {q.trim().length === 0 ? (
        <p className={searchStyles.empty}>검색어를 입력해주세요.</p>
      ) : list.length === 0 ? (
        <p className={searchStyles.empty}>검색 결과가 없습니다.</p>
      ) : (
        <>
          <div className={styles.grid}>
            {list.map((product, index) => {
              const discounted =
                (Number(product.sellAmt) ?? 0) -
                Math.floor((Number(product.sellAmt) ?? 0) * ((Number(product.discountRate) ?? 0) / 100));
              return (
                <div key={index} className={styles.card}>
                  <div className={styles.imageWrap}>
                    <Link href={`/products/all/${product.id}`} className={styles.imageLink}>
                      {product.src ? (
                        <img src={product.src} alt={product.prodNm ?? ''} className={styles.image} />
                      ) : (
                        <div title={product.prodNm ?? ''} className={`${styles.image} ${styles.defaultImg}`} />
                      )}
                    </Link>
                  </div>
                  <Link href={`/products/all/${product.id}`} className={styles.info}>
                    <p className={styles.name}>{product.prodNm}</p>
                    <div className={styles.priceRow}>
                      {(Number(product.discountRate) ?? 0) > 0 && (
                        <span className={styles.discount}>{product.discountRate}%</span>
                      )}
                      <span className={styles.price}>{discounted.toLocaleString()}원</span>
                      {(Number(product.discountRate) ?? 0) > 0 && product.sellAmt && (
                        <span className={styles.originalPrice}>{Number(product.sellAmt).toLocaleString()}원</span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className={styles.paging}>
            <button
              className={styles.pagingBtn}
              disabled={end}
              onClick={() => {
                const lastItem = list[list.length - 1];
                if (lastItem?.id) setLastId(lastItem.id);
              }}
            >
              {end ? '마지막 상품입니다' : '더 보기'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
