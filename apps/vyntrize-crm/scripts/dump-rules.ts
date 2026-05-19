import { vyntrizeDb as prisma } from '@platform/vyntrize-db';

async function main() {
  const rules = await prisma.workflowRule.findMany();
  console.log(JSON.stringify(rules, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
