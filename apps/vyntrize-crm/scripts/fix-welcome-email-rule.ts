/**
 * Fix: Update the "New lead: enroll in welcome sequence" workflow rule
 * to use enroll_drip action instead of send_email.
 *
 * The send_email action calls EmailGenerationAgent which only creates
 * a draft for approval — it never sends. enroll_drip actually sends.
 *
 * Run: npm run fix:welcome-rule
 */

import { PrismaClient } from '@platform/vyntrize-db/src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.CRM_DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // 1. Find the welcome drip sequence
  const sequence = await prisma.dripSequence.findFirst({
    where: { name: 'New Lead Welcome Sequence' },
    select: { id: true, name: true },
  });

  if (!sequence) {
    console.error('❌ "New Lead Welcome Sequence" not found. Run seed:automation first.');
    process.exit(1);
  }

  console.log(`✓ Found sequence: "${sequence.name}" (${sequence.id})`);

  // 2. Find the workflow rule
  const rule = await prisma.workflowRule.findFirst({
    where: { name: 'New lead: enroll in welcome sequence' },
    select: { id: true, name: true, actions: true },
  });

  if (!rule) {
    console.error('❌ Workflow rule "New lead: enroll in welcome sequence" not found.');
    process.exit(1);
  }

  console.log(`✓ Found rule: "${rule.name}" (${rule.id})`);
  console.log(`  Current actions: ${JSON.stringify(rule.actions)}`); 

  // 3. Update the action from send_email to enroll_drip
  const newActions = [
    {
      type: 'enroll_drip',
      config: { sequenceId: sequence.id },
    },
  ];

  await prisma.workflowRule.update({
    where: { id: rule.id },
    data: { actions: newActions },
  });

  console.log(`✓ Updated actions to: ${JSON.stringify(newActions)}`);
  console.log('\n✅ Done. New leads will now be enrolled in the welcome drip sequence.');
  console.log('   The drip sequence will send the first email immediately (0h delay).');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
