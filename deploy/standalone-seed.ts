/**
 * Standalone seed script for production deployment
 * This script can run independently without workspace dependencies
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.CRM_DATABASE_URL || process.env.VYNTRIZE_DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Vyntrise2026!';

const users = [
    { email: 'abdisa@vyntrise.com', displayName: 'Abdisa Bati', role: 'ADMIN' as const },
    { email: 'abenezer@vyntrise.com', displayName: 'Abenezer Seyoum', role: 'ADMIN' as const },
    { email: 'biniyam@vyntrise.com', displayName: 'Biniyam Lombe', role: 'MEMBER' as const },
    { email: 'mesay@vyntrise.com', displayName: 'Mesay Alemayehu', role: 'MEMBER' as const },
    { email: 'gedion@vyntrise.com', displayName: 'Gedion Bula', role: 'MEMBER' as const },
    { email: 'mahlet@vyntrise.com', displayName: 'Mahlet Getachew', role: 'MEMBER' as const },
    { email: 'abel@vyntrise.com', displayName: 'Abel Legesse', role: 'MEMBER' as const },
];

async function main() {
    console.log(`Seeding ${users.length} CRM users with default password...`);
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    for (const u of users) {
        const existing = await prisma.crmUser.findUnique({ where: { email: u.email } });
        if (existing) {
            console.log(`  ⏭  ${u.email} already exists — skipped`);
            continue;
        }
        await prisma.crmUser.create({
            data: { ...u, passwordHash: hash, isActive: true },
        });
        console.log(`  ✓  ${u.displayName} <${u.email}> [${u.role}]`);
    }

    console.log(`\nDone. Default password: ${DEFAULT_PASSWORD}`);
    console.log('Each user should change their password after first login.');
}

main()
    .catch((e) => { 
        console.error('Seed failed:', e); 
        process.exit(1); 
    })
    .finally(() => prisma.$disconnect());
