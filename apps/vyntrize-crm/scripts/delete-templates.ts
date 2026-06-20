import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function main() {
    await prisma.emailTemplate.deleteMany();
    console.log('Deleted all email templates');
}
main().catch(console.error).finally(() => prisma.$disconnect());
