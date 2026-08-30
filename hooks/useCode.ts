import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/libs/api';

/**
 * 공통 하위코드 목록 조회 (비회원/게스트).
 * 상품상세 등과 동일하게 publicApi 를 사용해 게스트 토큰이 정상 첨부되도록 한다.
 * (generated WebCommonControllerApi 는 토큰 인터셉터를 타지 않아 401 발생)
 */
export function useCode(codeUpper: string) {
  return useQuery({
    queryKey: ['selectLowerCodeByCodeUpper', codeUpper],
    queryFn: async () => {
      const res = await publicApi.get(`/frontWeb/webCommon/lower/${codeUpper}`);
      return res.data.body;
    },
    enabled: !!codeUpper,
    staleTime: 60_000,
  });
}
