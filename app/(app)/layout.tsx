import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import QueryProvider from '@/provider/QueryProvider';
import AuthProvider from '@/provider/AuthProvider';
import '@/app/globals.scss';

export const metadata: Metadata = {
    title: 'GGUANGGU',
    description: 'GGUANGGU 온라인 쇼핑몰',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
        <body>
        <AuthProvider>
            <QueryProvider>
                <AntdRegistry>
                    {children}
                </AntdRegistry>
            </QueryProvider>
        </AuthProvider>
        </body>
        </html>
    );
}