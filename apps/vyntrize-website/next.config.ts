import type { NextConfig } from 'next';

const enableStandalone = process.env.NEXT_STANDALONE === 'true' || process.platform !== 'win32';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
  ...(enableStandalone ? { output: 'standalone' } : {}),
  transpilePackages: ['motion', '@platform/vyntrize-db'],
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    '@prisma/client-runtime-utils',
  ],
  webpack: (config, { dev }) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
  async redirects() {
    return [
      // NOTE: bare domain → www redirect is handled exclusively by Caddy (redir 301).
      // Do NOT add a www redirect here — it creates a redirect loop when Caddy
      // passes the original Host header to Next.js.

      // Kill the phantom /en locale prefix — no i18n is configured on this site.
      // Redirect /en → / and /en/<anything> → /<anything> so Google stops crawling it.
      {
        source: '/en',
        destination: '/',
        permanent: true,
      },
      {
        source: '/en/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
