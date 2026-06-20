import { prisma } from './apps/vyntrize-crm/lib/prisma';

async function main() {
    const templates = await prisma.emailTemplate.findMany();
    console.log(JSON.stringify(templates, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
