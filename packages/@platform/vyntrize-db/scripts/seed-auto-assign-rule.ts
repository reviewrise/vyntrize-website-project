import { vyntrizeDb } from '../src/client';
import { AutonomyLevel } from '../src/generated/client';

async function main() {
    console.log('Seeding Round-Robin Lead Auto-Assign Workflow Rule...');
    const prisma = vyntrizeDb;

    const rule = await prisma.workflowRule.create({
        data: {
            name: 'Auto-Assign & Notify Staff on Lead Creation',
            description: 'Assigns new leads via round-robin and notifies the assigned staff member.',
            triggerEvent: 'lead_created',
            autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
            isActive: true,
            priority: 10, // Run before other rules
            conditions: [], // No conditions = runs for every lead_created event
            actions: [
                {
                    type: 'assign_lead',
                    config: { strategy: 'round-robin' },
                },
                {
                    type: 'notify_staff',
                    config: {},
                }
            ],
        },
    });

    console.log(`Created Workflow Rule: ${rule.name} (${rule.id})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await vyntrizeDb.$disconnect();
    });
