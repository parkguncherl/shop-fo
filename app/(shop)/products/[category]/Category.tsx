'use client';

import { usePartnerCodeByUk } from '@/hooks/usePartnerCodeByUk';
import Contents from '@/app/(shop)/products/[category]/Contents';
import Product from '@/app/(shop)/products/[category]/Product';

/** 상품 - 카테고리 (조건부) 페이지 */
const Category = ({ codeCd }: { codeCd: string }) => {
  const { data: partnerCode, isLoading } = usePartnerCodeByUk({
    codeUpper: 'P0001',
    codeCd: codeCd,
  });

  return !isLoading && partnerCode ? partnerCode?.codeEtc == 'CONTENT' ? <Contents /> : <Product /> : <></>;
};

export default Category;
