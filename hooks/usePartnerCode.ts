import { useQuery } from '@tanstack/react-query';
import { WebCommonControllerApi } from '@/generated';
import { apiConfig } from '@/libs/apiConfig';

const webCommonApi = new WebCommonControllerApi(apiConfig);

export function usePartnerCode(partnerUpperCode: string) {
  return useQuery({
    queryKey: ['selectLowerCodeByCodeUpper', partnerUpperCode],
    queryFn: async () => {
      const res = await webCommonApi.partnerCodeList({ partnerUpperCode: partnerUpperCode });
      return res.data.body;
    },
    enabled: !!partnerUpperCode,
  });
}
