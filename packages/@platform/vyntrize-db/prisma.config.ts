import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// Load local .env first, fall back to root .env
dotenv.config({ path: '.env' });
dotenv.config({ path: '../../../.env' });

const url =
    process.env.VYNTRIZE_DATABASE_URL ||
    process.env.CRM_DATABASE_URL ||
    '';

export default defineConfig({
    datasource: {
        url,
    },
});
