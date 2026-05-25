import { PrismaClient } from '../src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const url =
    process.env.VYNTRIZE_DATABASE_URL ||
    process.env.CRM_DATABASE_URL ||
    '';

if (!url) {
    console.error('No database URL found.');
    process.exit(1);
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log(`Setting bookingSlug 'alex-sales' to the first admin user...`);
    
    const adminUser = await prisma.crmUser.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!adminUser) {
        console.error('No admin user found. Run seed first.');
        return;
    }

    await prisma.crmUser.update({
        where: { id: adminUser.id },
        data: { bookingSlug: 'alex-sales' }
    });

    console.log(`  ✓ Success! ${adminUser.email} now has the booking slug 'alex-sales'.`);
    console.log(`  ✓ You can now test the API at: /api/book/alex-sales`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
