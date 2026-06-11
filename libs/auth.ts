import type { NextAuthOptions } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import axios from 'axios';
import { cookies } from 'next/headers';
import { COOKIE_KEYS } from '@/libs/const';

const BASE_URL = process.env.NEXT_SERVER_API_ENDPOINT ?? 'http://localhost:8080/shop-ap';
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET?.trim();

export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: KAKAO_CLIENT_SECRET || undefined,
      client: {
        token_endpoint_auth_method: KAKAO_CLIENT_SECRET ? 'client_secret_post' : 'none',
      },
    }),
  ],

  callbacks: {
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
          (user as any).shopToken = {
            accessToken: data.body.accessToken,
            refreshToken: data.body.refreshToken,
            socialAccountId: data.body.memberId,
            nickname: data.body.nickname,
            profileImage: data.body.profileImage,
            email: data.body.email,
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
      session.email = shopToken?.email;
      if (session.user && shopToken) {
        session.user.name = shopToken.nickname;
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