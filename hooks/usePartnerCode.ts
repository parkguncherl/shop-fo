import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { publicApi } from '@/libs/api';
import { getCookie } from 'cookies-next';
import { COOKIE_KEYS } from '@/libs/const';
import { PartnerCodeResponseLowerSelect } from '@/generated';

export function usePartnerCode(partnerUpperCode: string): UseQueryResult<PartnerCodeResponseLowerSelect[], Error> {
  const guestToken = getCookie(COOKIE_KEYS.GUEST_TOKEN);

  console.log('guestToken ==>', guestToken);
  return useQuery({
    queryKey: ['partnerCodeList', partnerUpperCode],
    queryFn: async () => {
      const res = await publicApi.get(`/frontWeb/webCommon/partnerCode/${partnerUpperCode}`);
      return res.data.body;
    },
    enabled: !!partnerUpperCode && !!guestToken, // ← guestToken 있을 때만 호출
  });
}
