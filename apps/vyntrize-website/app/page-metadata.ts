/**
 * Shared metadata helper for all pages.
 * Import and use in each page's generateMetadata or metadata export.
 */
import type { Metadata } from 'next';

const BASE_URL = 'https://www.vyntrise.com';

export function buildMeta(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `${BASE_URL}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      title: opts.title,
      description: opts.description,
      images: ['/og-image.png'],
    },
  };
}
