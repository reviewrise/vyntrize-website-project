// Re-export the shared Vyntrize database client from @platform/vyntrize-db
// The client connects to vyntrize_db via VYNTRIZE_DATABASE_URL
import { vyntrizeDb, type PrismaClient } from '@platform/vyntrize-db';

export const prisma = vyntrizeDb as unknown as PrismaClient;
