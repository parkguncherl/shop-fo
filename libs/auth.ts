import type { NextAuthOptions } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import NaverProvider from 'next-auth/providers/naver';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';
import { cookies } from 'next/headers';
import { COOKIE_KEYS } from '@/libs/const';

// 서버사이드 전용 (NEXT_SERVER_API_ENDPOINT 사용)
const BASE_URL = process.env.NEXT_SERVER_API_ENDPOINT ?? 'http://localhost:8080/shop-ap';

export const authOptions: NextAuthOptions = {
  providers: [
    // ── 카카오 로그인 ────────────────────────────────────────────────
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),

    // ── 네이버 로그인 ────────────────────────────────────────────────
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),

    // ── 구글 로그인 ──────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    /**
     * 소셜 OAuth 인증 완료 후
     * → 백엔드 /frontWeb/login/social/callback 호출
     * → tb_social_account 조회/생성 + 서비스 JWT 발급
     */
    async signIn({ user, account }) {
      try {
        const cookieStore = await cookies();
        const guestId = cookieStore.get(COOKIE_KEYS.GUEST_ID)?.value ?? null;

        const { data } = await axios.post(`${BASE_URL}/frontWeb/login/social/callback`, {
          provider: account?.provider,
          providerId: account?.providerAccountId,
          email: user.email,
          nickname: user.name,
          profileImage: user.image,
          guestId,
        });

        if (data?.body?.accessToken) {
          // user 객체에 임시 저장 → jwt 콜백에서 꺼내 씀
          (user as any).shopToken = {
            accessToken:  data.body.accessToken,
            refreshToken: data.body.refreshToken,
            socialAccountId: data.body.memberId,
            nickname:     data.body.nickname,
            profileImage: data.body.profileImage,
            email:        data.body.email,
          };
          return true;
        }
        return false;
      } catch (e) {
        console.error('소셜 로그인 백엔드 연동 실패', e);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // 최초 로그인 시에만 user 객체 존재
      if (user && (user as any).shopToken) {
        token.shopToken = (user as any).shopToken;
        token.provider = account?.provider;
      }
      return token;
    },

    async session({ session, token }) {
      const shopToken = token.shopToken as any;
      session.token = { accessToken: shopToken?.accessToken, refreshToken: shopToken?.refreshToken } as any;
      session.provider = token.provider as string;
      session.socialAccountId = shopToken?.socialAccountId;
      session.email    = shopToken?.email;
      // 세션 user 정보 보강
      if (session.user && shopToken) {
        session.user.name  = shopToken.nickname;
        session.user.image = shopToken.profileImage;
        session.user.email = shopToken.email;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 },
  secret: process.env.NEXTAUTH_SECRET,
};
