import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { publicApi } from '@/libs/api';
import { PartnerCodeResponseLowerSelect } from '@/generated';
import { useUiStore } from '@/stores/uiStore';

export function usePartnerCode(partnerUpperCode: string): UseQueryResult<PartnerCodeResponseLowerSelect[], Error> {
  const { guestReady } = useUiStore();

  return useQuery({
    queryKey: ['partnerCodeList', partnerUpperCode],
    queryFn: async () => {
      const res = await publicApi.get(`/frontWeb/webCommon/partnerCode/${partnerUpperCode}`);
      return res.data.body;
    },
    enabled: guestReady && !!partnerUpperCode,
  });
}
