import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: process.env.NEXT_OUTPUT as 'standalone' | undefined,
    transpilePackages: ['@platform/vyntrize-db'],
    serverExternalPackages: [
        '@prisma/client',
        '@prisma/adapter-pg',
        '@prisma/client-runtime-utils',
    ],
    experimental: {
        serverActions: {
            allowedOrigins: ['crm.vyntrise.com', 'localhost:3014'],
        },
    },
};

export default nextConfig;
