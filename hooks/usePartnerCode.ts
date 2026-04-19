import { useQuery } from '@tanstack/react-query';
import { DisplayControllerApi } from '@/generated/src/api/display-controller-api';

const displayApi = new DisplayControllerApi();

export function usePartnerCode(partnerUpperCode: string) {
  return useQuery({
    queryKey: ['categoryList', partnerUpperCode],
    queryFn: async () => {
      const res = await displayApi.categoryList({ partnerUpperCode });
      return res.data.body;
    },
    enabled: !!partnerUpperCode,
  });
}
