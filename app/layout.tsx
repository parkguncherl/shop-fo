import type { Metadata } from 'next';
import QueryProvider from '@/provider/QueryProvider';
import AuthProvider from '@/provider/AuthProvider';
import ToastProvider from '@/provider/ToastProvider';
import { ConfirmProvider } from '@/components/common/ConfirmModal/ConfirmProvider';
import './globals.scss';

const SITE_URL = process.env.NEXT_BASE_URL ?? 'https://mapsiggun.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: '맵시꾼', template: '%s | 맵시꾼' },
  description: '맵시꾼은 중년 여성을 위한 편안한 의류를 소개하는 온라인 쇼핑몰입니다.',
  keywords: ['맵시꾼', '중년 여성 의류', '중년 여성 편안한 의류', '여성 편안한 옷', '여성 의류 쇼핑몰'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  icons: { icon: '/images/ggu_favicon.svg' },
  openGraph: {
    title: '맵시꾼',
    description: '중년 여성을 위한 편안한 의류를 맵시꾼에서 만나보세요.',
    siteName: '맵시꾼',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '맵시꾼',
    description: '중년 여성을 위한 편안한 의류를 맵시꾼에서 만나보세요.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <AuthProvider>
          <QueryProvider>
            <ConfirmProvider>
              {children}
              <ToastProvider />
            </ConfirmProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
