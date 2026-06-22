import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';
import { getCookie } from 'cookies-next';
import { COOKIE_KEYS } from '@/libs/const';

const BASE_URL = process.env.NEXT_PUBLIC_SHOP_API_ENDPOINT;

// ─── 공통 인스턴스 생성 ────────────────────────────────
const createInstance = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true, // ← 쿠키 자동 첨부
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.response.use(
    (res) => res,
    (error: AxiosError<{ message?: string; resultMessage?: string }>) => {
      const status = error.response?.status;
      const message = error.response?.data?.resultMessage ?? error.response?.data?.message ?? error.message;
      return Promise.reject({ status, message });
    },
  );

  return instance;
};

// ─── publicApi: 비회원 (Guest Token 첨부) ─────────────
export const publicApi = createInstance();

publicApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const guestToken = getCookie(COOKIE_KEYS.GUEST_TOKEN);
  if (guestToken) {
    config.headers.set('X-Guest-Token', guestToken as string);
  }
  return config;
});

// ─── authApi: 회원 (Bearer Token 첨부) ────────────────
export const authApi = createInstance();

authApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const session = await getSession();

    if (!session) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('인증이 필요합니다.'));
    }

    config.headers.Authorization = `Bearer ${session.token.accessToken}`;

    const guestToken = getCookie(COOKIE_KEYS.GUEST_TOKEN);
    if (guestToken) {
      config.headers.set('X-Guest-Token', guestToken as string);
    }

    return config;
  },
  (error) => Promise.reject(error),
);
