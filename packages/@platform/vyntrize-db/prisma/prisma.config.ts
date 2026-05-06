import { defineConfig } from '@prisma/client';

export default defineConfig({
  adapter: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL || process.env.VYNTRIZE_DATABASE_URL || 'postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db?sslmode=disable',
  },
});
