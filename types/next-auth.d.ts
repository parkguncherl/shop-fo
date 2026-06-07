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
    memberId?: number;   // 소셜 로그인 회원 ID
    error?:    string;
  }

  interface User extends ISessionUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    user:      ISessionUser;
    provider?: string;
    memberId?: number;
  }
}
