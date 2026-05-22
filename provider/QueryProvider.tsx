'use client';

import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { isAxiosError } from 'axios';
import { MutationCache, QueryCache } from '@tanstack/query-core';
import { toastError } from '@/components/common/Others/ToastMessage';
import { useBlockStore } from '@/stores/useBlockStore';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // const [queryClient] = useState(
  //   () =>
  //     new QueryClient({
  //       defaultOptions: {
  //         queries: {
  //           staleTime: 1000 * 60 * 3, // 3분
  //           gcTime: 1000 * 60 * 10, // 10분
  //           retry: 1,
  //           refetchOnWindowFocus: false,
  //         },
  //       },
  //     }),
  // );

  // blocking 에 필요한 전역 State 동기화
  const [startBlock] = useBlockStore((s) => [s.startBlock]);

  // 내부 상수
  const delaySeconds = 20;

  // state 대신 메모이징
  const queryClient = useMemo(
    () =>
      new QueryClient({
        // [조회성 useQuery 전역 에러 감시]
        queryCache: new QueryCache({
          onError: (error) => {
            // Axios 에러 코드나 Fetch 에러 상태 확인
            if (isAxiosError(error) && error?.response?.status === 429) {
              // 지정된 시간에 따라 Zustand 차단기 작동 및 타이머 동기화
              startBlock(delaySeconds);

              toastError('잦은 요청으로 인한 한시적 차단 수행됨, 잠시 후 다시 시도해 주세요.');
            }
          },
        }),

        // 2. 모든 useMutation(CUD 작업)의 에러를 전역 감시
        mutationCache: new MutationCache({
          onError: (error, variables, context, mutation) => {
            if (isAxiosError(error) && error.response?.status === 429) {
              // 지정된 시간에 따라 Zustand 차단기 작동 및 타이머 동기화
              startBlock(delaySeconds);

              toastError('잦은 요청으로 인한 한시적 차단 수행됨, 잠시 후 다시 시도해 주세요.');
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 3, // 3분
            gcTime: 1000 * 60 * 10, // 10분
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
