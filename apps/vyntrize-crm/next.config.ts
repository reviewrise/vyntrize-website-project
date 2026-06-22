import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: process.env.NEXT_OUTPUT as 'standalone' | undefined,
    transpilePackages: ['@platform/vyntrize-db', '@platform/tokens'],
    serverExternalPackages: [
        '@prisma/client',
        '@prisma/client-runtime-utils',
        'bullmq',
        'ioredis',
    ],
    experimental: {
        serverActions: {
            allowedOrigins: ['crm.vyntrise.com', 'localhost:3014'],
        },
    },
};

export default nextConfig;
 