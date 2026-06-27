import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import QueryProvider from '@/provider/QueryProvider';
import AuthProvider from '@/provider/AuthProvider';
import ToastProvider from '@/provider/ToastProvider';
import { ConfirmProvider } from '@/components/common/ConfirmModal/ConfirmProvider';
import './globals.scss';

export const metadata: Metadata = {
  title: { default: 'GGUANGGU', template: '%s | GGUANGGU' },
  description: '꾸안꾸 온라인 쇼핑몰',
  icons: { icon: '/images/ggu_favicon.svg' },
  openGraph: {
    siteName: 'GGUANGGU',
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
            <AntdRegistry>
              <ConfirmProvider>
                {children}
                <ToastProvider />
              </ConfirmProvider>
            </AntdRegistry>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
