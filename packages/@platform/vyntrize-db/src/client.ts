import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
    // eslint-disable-next-line no-var
    var __vyntrizeDb: PrismaClient | undefined;
}

/**
 * Resolve the database URL from the environment.
 * Supports multiple env var names so both apps can work:
 *   - VYNTRIZE_DATABASE_URL  (vyntrize-website, vyntrize-db package itself)
 *   - CRM_DATABASE_URL       (vyntrize-crm)
 */
function getDatabaseUrl(): string {
    const url =
        process.env.VYNTRIZE_DATABASE_URL ||
        process.env.CRM_DATABASE_URL ||
        '';

    if (!url) {
        throw new Error(
            '[vyntrize-db] No database URL found. ' +
            'Set VYNTRIZE_DATABASE_URL or CRM_DATABASE_URL in your environment.'
        );
    }

    return url;
}

function getPoolConfig() {
    const connectionString = getDatabaseUrl();
    const sslMode = process.env.VYNTRIZE_DATABASE_SSL_MODE;
    const config: { connectionString: string; ssl?: Record<string, unknown> } = {
        connectionString,
    };

    if (!sslMode || sslMode === 'disable') {
        return config;
    }

    config.ssl = {};

    const isLocal =
        connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    if (isLocal && sslMode !== 'require' && sslMode !== 'verify-ca' && sslMode !== 'verify-full') {
        try {
            const url = new URL(connectionString);
            url.searchParams.delete('sslmode');
            return { connectionString: url.toString() };
        } catch {
            return { connectionString };
        }
    }

    if (sslMode === 'prefer' || sslMode === 'require') {
        config.ssl.rejectUnauthorized = sslMode === 'require';
    }

    if (sslMode === 'verify-ca' || sslMode === 'verify-full') {
        config.ssl.rejectUnauthorized = true;
        if (process.env.VYNTRIZE_DATABASE_SSL_CA) config.ssl.ca = process.env.VYNTRIZE_DATABASE_SSL_CA;
        if (process.env.VYNTRIZE_DATABASE_SSL_CERT) config.ssl.cert = process.env.VYNTRIZE_DATABASE_SSL_CERT;
        if (process.env.VYNTRIZE_DATABASE_SSL_KEY) config.ssl.key = process.env.VYNTRIZE_DATABASE_SSL_KEY;
    }

    return config;
}

function getLogConfig(): Array<'query' | 'error' | 'warn'> {
    if (process.env.NODE_ENV === 'development') return ['query', 'error', 'warn'];
    return ['error'];
}

function createClient(): PrismaClient {
    const pool = new Pool(getPoolConfig());
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log: getLogConfig(),
        errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
    });
}

const baseClient = globalThis.__vyntrizeDb ?? createClient();

if (process.env.NODE_ENV !== 'production') {
    globalThis.__vyntrizeDb = baseClient;
}

// Soft-delete extension: auto-filter deleted contacts from standard queries
export const vyntrizeDb = baseClient.$extends({
    query: {
        contact: {
            async findMany({ args, query }: any) {
                args.where = { deletedAt: null, ...args.where };
                return query(args);
            },
            async findFirst({ args, query }: any) {
                args.where = { deletedAt: null, ...args.where };
                return query(args);
            },
            async count({ args, query }: any) {
                args.where = { deletedAt: null, ...args.where };
                return query(args);
            },
        },
    },
});

export type VyntrizeDb = typeof vyntrizeDb;
