export const COOKIE_KEYS = {
  GUEST_TOKEN: 'gguanggu_guest_token',
  // 나중에 추가될 쿠키들
  // RECENT_VIEWED: 'gguanggu_recent_viewed',
  // CART_ID: 'gguanggu_cart_id',
} as const;

export const Contents = {
  imgToken: /<<IMG\|([^>]+)>>/g, // <<IMG|image_title>>, 최초 캡처 그룹에서 파일명 추출 가능
  carriageReturn: /\\n/g, // '\\n' → 문자열 \n
};
