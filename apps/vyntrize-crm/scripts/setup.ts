/**
 * One-command CRM setup:
 *   pnpm --filter vyntrize-crm db:setup
 *
 * Steps:
 *   1. Connect as superuser → create crm_user + vyntrize_crm database
 *   2. Run prisma migrate deploy
 *   3. Run prisma generate
 *   4. Seed all team users
 */

import { execSync } from 'child_process';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Config ──────────────────────────────────────────────────────────────────

const CRM_DATABASE_URL = process.env.CRM_DATABASE_URL;
const SUPERUSER_URL =
    process.env.POSTGRES_SUPERUSER_URL ?? 'postgresql://postgres:password@localhost:5432/postgres';
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Vyntrise2026!';

if (!CRM_DATABASE_URL) {
    console.error('CRM_DATABASE_URL is not set in apps/vyntrize-crm/.env');
    process.exit(1);
}

const url = new URL(CRM_DATABASE_URL); const DB_NAME = url.pathname.replace('/', '');
const DB_USER = url.username;
const DB_PASS = decodeURIComponent(url.password);

const team = [
    { email: 'abdisa@vyntrise.com', displayName: 'Abdisa Bati', role: 'ADMIN' as const },
    { email: 'abenezer@vyntrise.com', displayName: 'Abenezer Seyoum', role: 'ADMIN' as const },
    { email: 'biniyam@vyntrise.com', displayName: 'Biniyam Lombe', role: 'MEMBER' as const },
    { email: 'mesay@vyntrise.com', displayName: 'Mesay Alemayehu', role: 'MEMBER' as const },
    { email: 'gedion@vyntrise.com', displayName: 'Gedion Bula', role: 'MEMBER' as const },
    { email: 'mahlet@vyntrise.com', displayName: 'Mahlet Getachew', role: 'MEMBER' as const },
    { email: 'abel@vyntrise.com', displayName: 'Abel Legesse', role: 'MEMBER' as const },
];

function run(cmd: string, label: string) {
    console.log(`\n▶  ${label}`);
    execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
}

function makeClient(connStr: string) {
    return new Client({ connectionString: connStr, ssl: false });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('Vyntrize CRM — one-command setup\n');

    // ── Step 1: Provision DB ──────────────────────────────────────────────────
    console.log('▶  Step 1: Provisioning database and user');

    const super1 = makeClient(SUPERUSER_URL);
    await super1.connect();

    // Create role if not exists
    const roleExists = await super1.query(
        `SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = $1`, [DB_USER]
    );
    if (roleExists.rowCount === 0) {
        await super1.query(`CREATE ROLE "${DB_USER}" WITH LOGIN PASSWORD '${DB_PASS}'`);
        console.log(`   ✓ Role "${DB_USER}" created`);
    } else {
        console.log(`   ⏭  Role "${DB_USER}" already exists`);
    }

    // Create database if not exists
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

    // Grant schema privileges inside the new DB
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

    // ── Step 3: Seed users ────────────────────────────────────────────────────
    // Note: run `pnpm db:generate` separately if you hit EPERM on Windows
    console.log('\n▶  Step 3: Seeding team users');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    for (const u of team) {
        const existing = await prisma.crmUser.findUnique({ where: { email: u.email } });
        if (existing) {
            console.log(`   ⏭  ${u.email} already exists`);
            continue;
        }
        await prisma.crmUser.create({ data: { ...u, passwordHash: hash, isActive: true } });
        console.log(`   ✓  ${u.displayName} <${u.email}> [${u.role}]`);
    }
    await prisma.$disconnect();

    console.log(`
✅  Setup complete!

   CRM URL:          http://localhost:3014
   Default password: ${DEFAULT_PASSWORD}

   Start the dev server:
     pnpm --filter vyntrize-crm dev
`);
}

main().catch((e) => {
    console.error('\n❌  Setup failed:', e.message ?? e);
    process.exit(1);
});
