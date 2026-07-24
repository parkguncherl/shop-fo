import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { publicApi } from '@/libs/api';
import { PartnerCode, WebCommonRequestPartnerCodeByUkFilter } from '@/generated';
import { useUiStore } from '@/stores/uiStore';

export function usePartnerCodeByUk(webCommonRequestPartnerCodeByUkFilter: WebCommonRequestPartnerCodeByUkFilter): UseQueryResult<PartnerCode, Error> {
  const guestReady = useUiStore((s) => s.guestReady);
  return useQuery({
    queryKey: ['partnerCodeByUk', webCommonRequestPartnerCodeByUkFilter],
    queryFn: async () => {
      const res = await publicApi.get(`/frontWeb/webCommon/partnerCodeByUk`, {
        params: {
          ...webCommonRequestPartnerCodeByUkFilter,
        },
      });
      return res.data.body;
    },
    enabled: !!webCommonRequestPartnerCodeByUkFilter && guestReady, // ← guestToken 있을 때만 호출
  });
}
