import type { Metadata } from 'next';
import QueryProvider from '@/provider/QueryProvider';
import AuthProvider from '@/provider/AuthProvider';
import ToastProvider from '@/provider/ToastProvider';
import { ConfirmProvider } from '@/components/common/ConfirmModal/ConfirmProvider';
import './globals.scss';

export const metadata: Metadata = {
  title: { default: '맵시꾼', template: '%s | 맵시꾼' },
  description: '맵시꾼 온라인 쇼핑몰',
  icons: { icon: '/images/ggu_favicon.svg' },
  openGraph: {
    siteName: '맵시꾼',
    type: 'website',
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
