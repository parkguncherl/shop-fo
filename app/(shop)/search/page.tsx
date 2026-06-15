import { Suspense } from 'react';
import SearchPage from './SearchPage';

const page = async ({ searchParams }: { searchParams: Promise<{ q?: string }> }) => {
  const { q } = await searchParams;
  return (
    <Suspense>
      <SearchPage keyword={q ?? ''} />
    </Suspense>
  );
};

export default page;
