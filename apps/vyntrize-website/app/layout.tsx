import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import CookieConsentProvider from '@/components/CookieConsentProvider';
import AgentChatbot from '@/components/AgentChatbot';
import ThemeProvider from '@/components/ThemeProvider';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const BASE_URL = 'https://www.vyntrise.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'VyntRise — AI-Powered Business Growth',
    template: '%s | VyntRise',
  },
  description:
    'VyntRise deploys autonomous AI agents that handle your reputation, leads, workflows, and data — 24/7, without a single manual step. Built for small businesses ready to grow.',
  keywords: [
    'AI automation', 'business automation', 'reputation management',
    'AI agents', 'intelligent automation', 'custom software', 'data analytics',
    'digital marketing', 'small business AI', 'VyntRise',
  ],
  authors: [{ name: 'VyntRise', url: BASE_URL }],
  creator: 'VyntRise',
  publisher: 'VyntRise Technologies',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'VyntRise',
    title: 'VyntRise — AI-Powered Business Growth',
    description:
      'Autonomous AI agents that handle your reputation, leads, workflows, and data — 24/7. Built for small businesses ready to grow.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VyntRise — AI-Powered Business Growth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vyntrise',
    creator: '@vyntrise',
    title: 'VyntRise — AI-Powered Business Growth',
    description:
      'Autonomous AI agents that handle your reputation, leads, workflows, and data — 24/7.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`scroll-smooth ${inter.variable} ${jetbrainsMono.variable} ${cormorantGaramond.variable}`}>
      <head>
        <meta name="google-site-verification" content="64_A0DW5_f5MZK0wbNSa2zGgR4_XjMg8Gb9KyF9suxA" />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <ThemeProvider>
          <CookieConsentProvider>
            <AnalyticsProvider />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieBanner />
            <AgentChatbot />
          </CookieConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
