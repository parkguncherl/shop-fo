export const COOKIE_KEYS = {
  GUEST_TOKEN: 'gguanggu_guestToken_1d',  // httpOnly JWT (보안)
  GUEST_ID:    'gguanggu_guestId_1d',     // 클라이언트 접근 가능 (장바구니 API용)
} as const;

export const Contents = {
  imgToken: /<<IMG\|([^>]+)>>/g, // <<IMG|image_title>>, 최초 캡처 그룹에서 파일명 추출 가능
  carriageReturn: /\\n/g, // '\\n' → 문자열 \n
};
