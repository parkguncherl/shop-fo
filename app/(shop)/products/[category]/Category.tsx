'use client';

import Contents from '@/app/(shop)/products/[category]/Contents';
import Product from '@/app/(shop)/products/[category]/Product';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';

/** 상품 - 카테고리 (조건부) 페이지 */
const Category = ({ codeCd }: { codeCd: string }) => {
  const categories = usePartnerCodeStore((s) => s.categories);
  const categoryReady = usePartnerCodeStore((s) => s.categoryReady);

  if (!categoryReady) return <></>;

  if (codeCd.toUpperCase() === 'ALL') return <Product categoryId="all" />;

  const partnerCode = categories.find((c) => c.codeCd === codeCd);
  return partnerCode?.codeEtc === 'CONTENT' ? <Contents /> : <Product categoryId={codeCd} />;
};

export default Category;
