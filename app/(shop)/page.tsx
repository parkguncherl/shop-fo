import { redirect } from 'next/navigation';
import { resolveRedirect } from '@/libs/redirectRules';

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

/**
 * 진입점 페이지 — searchParams 기반으로 리다이렉트
 * 규칙 추가/수정: @/libs/redirectRules.ts
 */
const page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  redirect(resolveRedirect(params));
};

export default page;
