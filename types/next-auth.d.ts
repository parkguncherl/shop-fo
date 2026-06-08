import 'next-auth';
import 'next-auth/jwt';
import { JwtAuthToken, UserResponseSelectByLoginId } from '@/generated';

interface ISessionUser extends UserResponseSelectByLoginId {
  token: JwtAuthToken;
}

declare module 'next-auth' {
  interface Session {
    user:      UserResponseSelectByLoginId;
    token:     JwtAuthToken;
    provider?: string;   // 'credentials' | 'kakao' | 'naver' | 'google'
    socialAccountId?: number;   // 소셜 로그인 계정 ID (tb_social_account.id)
    email?:    string;   // 소셜 로그인 이메일 (loginId)
    error?:    string;
  }

  interface User extends ISessionUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    user:      ISessionUser;
    provider?: string;
    socialAccountId?: number;
  }
}
