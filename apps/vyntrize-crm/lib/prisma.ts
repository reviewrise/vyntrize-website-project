// Re-export the shared Vyntrize database client from @platform/vyntrize-db
// The client connects to vyntrize_db via VYNTRIZE_DATABASE_URL
// Includes soft-delete extension for Contact model
export { vyntrizeDb as prisma } from '@platform/vyntrize-db';
