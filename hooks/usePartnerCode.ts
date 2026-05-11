import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/libs/api';
import { getCookie } from 'cookies-next';
import { COOKIE_KEYS } from '@/libs/const';

export function usePartnerCode(partnerUpperCode: string) {
  const guestToken = getCookie(COOKIE_KEYS.GUEST_TOKEN);

  console.log('guestToken ==>', guestToken);
  return useQuery({
    queryKey: ['selectLowerCodeByCodeUpper', partnerUpperCode],
    queryFn: async () => {
      const res = await publicApi.get(`/frontWeb/webCommon/lower/${partnerUpperCode}`);
      return res.data.body;
    },
    enabled: !!partnerUpperCode && !!guestToken, // ← guestToken 있을 때만 호출
  });
}
