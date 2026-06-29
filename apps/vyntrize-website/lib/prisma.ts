// Re-export the shared Vyntrize database client from @platform/vyntrize-db
// The client connects to vyntrize_db via VYNTRIZE_DATABASE_URL
import { vyntrizeDb } from '@platform/vyntrize-db';
import type { PrismaClient } from '@platform/vyntrize-db/src/generated/client';

export const prisma = vyntrizeDb as unknown as PrismaClient;
