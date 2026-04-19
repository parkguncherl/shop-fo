import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_SMART_API_ENDPOINT;
const env = process.env.NEXT_PUBLIC_APP_ENV;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: Bearer 토큰 자동 첨부 ────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// ─── Response interceptor: 에러 정규화 ────────────────
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;

    if (status === 401) {
      // 인증 만료 → 로그인 페이지로
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({ status, message });
  },
);

export default api;
