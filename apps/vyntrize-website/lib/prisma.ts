// Re-export the shared Vyntrize database client from @platform/vyntrize-db
// The client connects to vyntrize_db via VYNTRIZE_DATABASE_URL
export { vyntrizeDb as prisma } from '@platform/vyntrize-db';
