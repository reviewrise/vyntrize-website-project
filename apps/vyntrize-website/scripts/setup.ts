/**
 * One-command website DB setup:
 *   pnpm --filter vyntrize-website db:setup
 *
 * Steps:
 *   1. Connect as superuser → create website_user + vyntrize_website database
 *   2. Run prisma migrate deploy
 *   3. Run prisma generate
 */

import { execSync } from 'child_process';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const SUPERUSER_URL =
    process.env.POSTGRES_SUPERUSER_URL ?? 'postgresql://postgres:password@localhost:5432/postgres';

if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set in apps/vyntrize-website/.env');
    process.exit(1);
}

const url = new URL(DATABASE_URL);
const DB_NAME = url.pathname.replace('/', '');
const DB_USER = url.username;
const DB_PASS = decodeURIComponent(url.password);

function run(cmd: string, label: string) {
    console.log(`\n▶  ${label}`);
    execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
}

function makeClient(connStr: string) {
    return new Client({ connectionString: connStr, ssl: false });
}

async function main() {
    console.log('Vyntrize Website — database setup\n');

    // ── Step 1: Provision DB ──────────────────────────────────────────────────
    console.log('▶  Step 1: Provisioning database and user');

    const super1 = makeClient(SUPERUSER_URL);
    await super1.connect();

    const roleExists = await super1.query(
        `SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = $1`, [DB_USER]
    );
    if (roleExists.rowCount === 0) {
        await super1.query(`CREATE ROLE "${DB_USER}" WITH LOGIN PASSWORD '${DB_PASS}'`);
        console.log(`   ✓ Role "${DB_USER}" created`);
    } else {
        console.log(`   ⏭  Role "${DB_USER}" already exists`);
    }

    const dbExists = await super1.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]
    );
    if (dbExists.rowCount === 0) {
        await super1.query(`CREATE DATABASE "${DB_NAME}" OWNER "${DB_USER}"`);
        console.log(`   ✓ Database "${DB_NAME}" created`);
    } else {
        console.log(`   ⏭  Database "${DB_NAME}" already exists`);
    }

    await super1.query(`GRANT ALL PRIVILEGES ON DATABASE "${DB_NAME}" TO "${DB_USER}"`);
    await super1.end();

    const superDbUrl = SUPERUSER_URL.replace(/\/[^/]+$/, `/${DB_NAME}`);
    const super2 = makeClient(superDbUrl);
    await super2.connect();
    await super2.query(`GRANT ALL ON SCHEMA public TO "${DB_USER}"`);
    await super2.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${DB_USER}"`);
    await super2.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${DB_USER}"`);
    await super2.end();
    console.log(`   ✓ Schema privileges granted`);

    // ── Step 2: Migrate ───────────────────────────────────────────────────────
    run('npx prisma migrate deploy', 'Step 2: Running database migrations');

    // ── Step 3: Generate client ───────────────────────────────────────────────
    // Note: run `pnpm db:generate` separately if you hit EPERM on Windows
    run('npx prisma generate', 'Step 3: Generating Prisma client');

    console.log(`
✅  Setup complete!

   Website URL: http://localhost:3013

   Start the dev server:
     pnpm --filter vyntrize-website dev
`);
}

main().catch((e) => {
    console.error('\n❌  Setup failed:', e.message ?? e);
    process.exit(1);
});
