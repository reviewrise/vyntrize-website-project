import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: process.env.NEXT_OUTPUT as 'standalone' | undefined,
    transpilePackages: ['@platform/vyntrize-db'],
    serverExternalPackages: [
        '@prisma/client',
        '@prisma/adapter-pg',
        '@prisma/client-runtime-utils',
    ],
    // Provide a dummy DB URL at build time so the Prisma client can be
    // instantiated during static analysis. The real URL is injected at runtime.
    env: {
        CRM_DATABASE_URL:
            process.env.CRM_DATABASE_URL ?? 'postgresql://build:build@localhost:5432/build',
    },
    experimental: {
        serverActions: {
            allowedOrigins: ['crm.vyntrise.com', 'localhost:3014'],
        },
    },
};

export default nextConfig;
