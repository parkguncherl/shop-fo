import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { publicApi } from '@/libs/api';
import { getCookie } from 'cookies-next';
import { COOKIE_KEYS } from '@/libs/const';
import { PartnerCode, WebCommonRequestPartnerCodeByUkFilter } from '@/generated';

export function usePartnerCodeByUk(webCommonRequestPartnerCodeByUkFilter: WebCommonRequestPartnerCodeByUkFilter): UseQueryResult<PartnerCode, Error> {
  const guestToken = getCookie(COOKIE_KEYS.GUEST_TOKEN);

  console.log('guestToken ==>', guestToken);
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
    enabled: !!webCommonRequestPartnerCodeByUkFilter && !!guestToken, // ← guestToken 있을 때만 호출
  });
}
