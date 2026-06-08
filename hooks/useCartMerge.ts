'use client';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import publicApi from '@/libs/publicApi';
import { getGuestId, CART_QUERY_KEY } from '@/hooks/useCart';

/**
 * 소셜 로그인 완료 직후 게스트 장바구니 → 회원 장바구니 병합
 *
 * - session.socialAccountId 가 생기는 순간 한 번만 실행
 * - 병합 완료 후 cart 쿼리 무효화 → 최신 장바구니 자동 갱신
 */
export function useCartMerge() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const mergedRef = useRef<number | null>(null); // 이미 병합한 socialAccountId 기록

  useEffect(() => {
    if (status !== 'authenticated') return;

    const socialAccountId = session?.socialAccountId;
    if (!socialAccountId) return;

    // 같은 계정으로 이미 병합했으면 스킵
    if (mergedRef.current === socialAccountId) return;
    mergedRef.current = socialAccountId;

    const guestId = getGuestId();
    if (!guestId) return;

    publicApi
      .post('/frontWeb/cart/merge', null, {
        params: { guestId, socialAccountId },
      })
      .then(() => {
        // 병합 완료 → 장바구니 쿼리 갱신
        queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      })
      .catch((err) => {
        console.warn('[CartMerge] 병합 실패', err);
      });
  }, [session?.socialAccountId, status]);
}
