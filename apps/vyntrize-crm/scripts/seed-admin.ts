import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const displayName = process.env.SEED_ADMIN_NAME ?? 'Admin';

    if (!email || !password) {
        console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars are required');
        process.exit(1);
    }

    const existing = await prisma.crmUser.findUnique({ where: { email } });
    if (existing) {
        console.log(`Admin user ${email} already exists. Skipping.`);
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.crmUser.create({
        data: {
            email,
            displayName,
            passwordHash,
            role: 'ADMIN',
            isActive: true,
        },
    });

    console.log(`✓ Admin user created: ${user.email} (id: ${user.id})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
