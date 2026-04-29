/**
 * Seed CRM users into vyntrize_db
 * Run: pnpm --filter @platform/vyntrize-db seed:users
 */
import { PrismaClient } from '../src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const url =
    process.env.VYNTRIZE_DATABASE_URL ||
    process.env.CRM_DATABASE_URL ||
    '';

if (!url) {
    console.error('No database URL found. Set VYNTRIZE_DATABASE_URL or CRM_DATABASE_URL.');
    process.exit(1);
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Vyntrise2026!';

const team = [
    { email: 'abdisa@vyntrise.com', displayName: 'Abdisa Bati', role: 'ADMIN' as const },
    { email: 'abenezer@vyntrise.com', displayName: 'Abenezer Seyoum', role: 'ADMIN' as const },
    { email: 'biniyam@vyntrise.com', displayName: 'Biniyam Lombe', role: 'MEMBER' as const },
    { email: 'mesay@vyntrise.com', displayName: 'Mesay Alemayehu', role: 'MEMBER' as const },
    { email: 'gedion@vyntrise.com', displayName: 'Gedion Bula', role: 'MEMBER' as const },
    { email: 'mahlet@vyntrise.com', displayName: 'Mahlet Getachew', role: 'MEMBER' as const },
    { email: 'abel@vyntrise.com', displayName: 'Abel Legesse', role: 'MEMBER' as const },
];

async function main() {
    console.log(`Seeding ${team.length} CRM users...`);
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    for (const u of team) {
        const existing = await prisma.crmUser.findUnique({ where: { email: u.email } });
        if (existing) {
            console.log(`  ⏭  ${u.email} already exists`);
            continue;
        }
        await prisma.crmUser.create({ data: { ...u, passwordHash: hash, isActive: true } });
        console.log(`  ✓  ${u.displayName} <${u.email}> [${u.role}]`);
    }

    console.log(`\nDone. Default password: ${DEFAULT_PASSWORD}`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
