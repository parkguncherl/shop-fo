import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { publicApi } from '@/libs/api';
import { PartnerCodeResponseLowerSelect } from '@/generated';
import { useUiStore } from '@/stores/uiStore';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';

const CATEGORY_CODE = 'P0001';

export function usePartnerCode(partnerUpperCode: string): UseQueryResult<PartnerCodeResponseLowerSelect[], Error> {
  const { guestReady } = useUiStore();
  const setCategories = usePartnerCodeStore((s) => s.setCategories);

  return useQuery({
    queryKey: ['partnerCodeList', partnerUpperCode],
    queryFn: async () => {
      const res = await publicApi.get(`/frontWeb/webCommon/partnerCode/${partnerUpperCode}`);
      const list: PartnerCodeResponseLowerSelect[] = res.data.body ?? [];
      if (partnerUpperCode === CATEGORY_CODE) {
        setCategories(list);
      }
      return list;
    },
    enabled: guestReady && !!partnerUpperCode,
  });
}
