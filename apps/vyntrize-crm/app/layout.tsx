import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'Vyntrize CRM',
    description: 'Internal CRM for Vyntrize agency team',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" data-theme="light" suppressHydrationWarning>
            <body className={inter.variable}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
