import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'VyntRise — CRM',
    description: 'The VyntRise internal CRM — manage leads, campaigns, and AI workflows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" data-theme="light" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
            <body className="font-sans antialiased" style={{ fontFamily: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif' }}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
                <Toaster
                    position="bottom-right"
                    expand={false}
                    richColors={false}
                    closeButton={false}
                    toastOptions={{
                        style: {
                            background: 'transparent',
                            boxShadow: 'none',
                            border: 'none',
                            padding: 0,
                        },
                    }}
                />
            </body>
        </html>
    );
}

