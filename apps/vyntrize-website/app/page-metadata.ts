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
  ogImage?: string;
}): Metadata {
  const url = `${BASE_URL}${opts.path}`;
  const image = opts.ogImage ?? '/og-image.png';
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      title: opts.title,
      description: opts.description,
      images: [image],
    },
  };
}
