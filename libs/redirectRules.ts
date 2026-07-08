/**
 * 진입점 리다이렉트 규칙 정의
 *
 * 우선순위: 위에서 아래 순서로 평가됨
 * - param: URL 쿼리 파라미터 key
 * - value: 해당 파라미터 값 (undefined = 파라미터 존재만 확인)
 * - to: 리다이렉트 목적지 (함수 형태로 동적 경로 지원)
 *
 * 사용 예)
 *   /?ref=event_summer        → /products/SUMMER
 *   /?to=product&id=123       → /products/all/123
 *   /?campaign=new            → /products/NEW
 *   / (기본)                  → /products/all
 */

export interface RedirectRule {
  param: string;
  value?: string;
  to: (params: Record<string, string>) => string;
}

export const redirectRules: RedirectRule[] = [
  // ────────────────────────────────────────────────────────────
  // [패턴 1] ref 파라미터 — 이벤트/시즌 링크
  //
  //   진입 URL  : /?ref=event_summer
  //   이동 경로 : /products/SUMMER
  //
  //   사용 사례 : SNS 광고, 이메일 배너 등 특정 카테고리로 직행시킬 때
  //   확장 방법 : value 값과 to 경로만 바꿔서 규칙을 추가하면 됨
  //
  // {
  //   param: 'ref',
  //   value: 'event_summer',
  //   to: () => '/products/SUMMER',
  // },
  // {
  //   param: 'ref',
  //   value: 'event_winter',
  //   to: () => '/products/WINTER',
  // },
  // ────────────────────────────────────────────────────────────
  // [패턴 2] to=product — 상품 상세 직접 진입
  //
  //   진입 URL  : /?to=product&id=123
  //   이동 경로 : /products/all/123
  //
  //   사용 사례 : 카카오톡 공유, 문자 메시지 등 특정 상품 링크를 짧게 전달할 때
  //              id 파라미터가 없으면 /products/all 로 폴백됨
  //
  // {
  //   param: 'to',
  //   value: 'product',
  //   to: (params) => params['id'] ? `/products/all/${params['id']}` : DEFAULT_REDIRECT,
  // },
  // ────────────────────────────────────────────────────────────
  // [패턴 3] campaign 파라미터 — 마케팅 캠페인
  //
  //   진입 URL  : /?campaign=new
  //   이동 경로 : /products/NEW
  //
  //   사용 사례 : UTM 캠페인 연동, 신상품/기획전 랜딩 페이지로 보낼 때
  //              campaign 값과 카테고리 코드를 1:1 매핑
  //
  // {
  //   param: 'campaign',
  //   value: 'new',
  //   to: () => '/products/NEW',
  // },
  // {
  //   param: 'campaign',
  //   value: 'sale',
  //   to: () => '/products/SALE',
  // },
  // ────────────────────────────────────────────────────────────
  // [패턴 4] value 없이 param 존재만 확인 — 동적 경로
  //
  //   진입 URL  : /?category=OUTER
  //   이동 경로 : /products/OUTER
  //
  //   사용 사례 : 외부 시스템에서 카테고리 코드를 직접 파라미터로 넘길 때
  //              value를 생략하면 파라미터가 존재하기만 해도 규칙 적용
  //
  // {
  //   param: 'category',
  //   to: (params) => `/products/${params['category']}`,
  // },
];

/** 기본 리다이렉트 경로 */
export const DEFAULT_REDIRECT = '/products/10000';

/**
 * searchParams 기반으로 매칭되는 규칙의 목적지를 반환
 * 매칭 없으면 DEFAULT_REDIRECT 반환
 */
export function resolveRedirect(searchParams: Record<string, string>): string {
  for (const rule of redirectRules) {
    const paramValue = searchParams[rule.param];
    if (paramValue === undefined) continue;
    if (rule.value !== undefined && paramValue !== rule.value) continue;
    return rule.to(searchParams);
  }
  return DEFAULT_REDIRECT;
}
