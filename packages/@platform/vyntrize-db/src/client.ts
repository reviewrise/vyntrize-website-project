import { PrismaClient } from './generated/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
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

function getLogConfig(): Array<'query' | 'error' | 'warn'> {
    if (process.env.NODE_ENV === 'development') return ['query', 'error', 'warn'];
    return ['error'];
}

function createClient(): PrismaClient {
    // Inject into standard env var as well for safety
    const url = getDatabaseUrl();
    process.env.DATABASE_URL = url;
    
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    
    return new PrismaClient({
        adapter,
        log: getLogConfig(),
        errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}

const baseClient = globalThis.__vyntrizeDb ?? createClient();

if (process.env.NODE_ENV !== 'production') {
    globalThis.__vyntrizeDb = baseClient;
}

// Soft-delete extension: auto-filter deleted contacts from standard queries
export const vyntrizeDb = baseClient.$extends({
    query: {
        contact: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async findMany({ args, query }: any) {
                args.where = { deletedAt: null, ...args.where };
                return query(args);
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async findFirst({ args, query }: any) {
                args.where = { deletedAt: null, ...args.where };
                return query(args);
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async count({ args, query }: any) {
                args.where = { deletedAt: null, ...args.where };
                return query(args);
            },
        },
    },
});

export type VyntrizeDb = typeof vyntrizeDb;
