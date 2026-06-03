import { PrismaClient, LeadStage, AutonomyLevel } from '../src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../../.env' });
dotenv.config({ path: '.env' });

const connectionString = process.env.CRM_DATABASE_URL || process.env.VYNTRIZE_DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting Automation Seed...');

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Pipeline Stages
    // ──────────────────────────────────────────────────────────────────────────
    console.log('Seeding Pipeline Stages...');
    
    // Clear existing for a clean slate
    await prisma.pipelineStage.deleteMany();

    await prisma.pipelineStage.createMany({
        data: [
            {
                name: 'New',
                description: 'Newly captured or imported lead.',
                stageOrder: 1,
                probability: 10,
                autoCreateTask: true,
                taskTemplate: {
                    title: 'Contact new lead within 24 hours',
                    taskType: 'MANUAL',
                    priority: 'HIGH'
                },
                isActive: true
            },
            {
                name: 'Contacted',
                description: 'Initial outreach has been made.',
                stageOrder: 2,
                probability: 20,
                autoCreateTask: false,
                isActive: true
            },
            {
                name: 'Qualified',
                description: 'Lead is a good fit and has budget/timeline.',
                stageOrder: 3,
                probability: 50,
                autoCreateTask: false,
                isActive: true
            },
            {
                name: 'Proposal Sent',
                description: 'Formal proposal or quote sent.',
                stageOrder: 4,
                probability: 75,
                autoCreateTask: true,
                taskTemplate: {
                    title: 'Follow up on proposal',
                    taskType: 'EMAIL',
                    priority: 'MEDIUM'
                },
                isActive: true
            },
            {
                name: 'Won',
                description: 'Deal is closed won.',
                stageOrder: 5,
                probability: 100,
                autoCreateTask: true,
                taskTemplate: {
                    title: 'Send Onboarding Form',
                    taskType: 'MANUAL',
                    priority: 'MEDIUM'
                },
                isActive: true
            },
            {
                name: 'Lost',
                description: 'Deal is closed lost.',
                stageOrder: 6,
                probability: 0,
                autoCreateTask: false,
                isActive: true
            }
        ]
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Workflow Rules
    // ──────────────────────────────────────────────────────────────────────────
    console.log('Seeding Workflow Rules...');
    
    await prisma.workflowRule.deleteMany();

    await prisma.workflowRule.createMany({
        data: [
            {
                name: 'Speed to Lead SLA',
                description: 'Ensures new leads are contacted quickly.',
                triggerEvent: 'lead_created',
                conditions: [
                    {
                        field: 'stage',
                        operator: 'eq',
                        value: 'NEW'
                    }
                ],
                actions: [
                    { type: 'create_task', config: { title: 'Contact new lead immediately', dueDaysOffset: 1 } },
                    { type: 'notify_staff', config: { messageTemplate: 'A new lead entered the pipeline!' } }
                ],
                autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
                priority: 100,
                isActive: true
            },
            {
                name: 'High Score Lead Alert',
                description: 'Notify management when a high-scoring lead is detected.',
                triggerEvent: 'lead_updated',
                conditions: [
                    {
                        field: 'score',
                        operator: 'gt',
                        value: 80
                    }
                ],
                actions: [
                    { type: 'notify_staff', config: { messageTemplate: 'Hot lead detected!' } }
                ],
                autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
                priority: 90,
                isActive: true
            },
            {
                name: 'Auto-Assign Stagnant',
                description: 'Assign stagnant leads to a specific manager.',
                triggerEvent: 'lead_updated',
                conditions: [
                    {
                        field: 'daysInStage',
                        operator: 'gte',
                        value: 14
                    }
                ],
                actions: [
                    { type: 'notify_staff', config: { messageTemplate: 'Lead is stagnant for 14 days' } }
                ],
                autonomyLevel: AutonomyLevel.SUGGEST_APPROVE,
                priority: 70,
                isActive: true
            }
        ]
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Stage Progression Rules
    // ──────────────────────────────────────────────────────────────────────────
    console.log('Seeding Stage Progression Rules...');
    
    await prisma.stageProgressionRule.deleteMany();

    await prisma.stageProgressionRule.createMany({
        data: [
            {
                fromStage: LeadStage.NEW,
                toStage: LeadStage.CONTACTED,
                criteria: { minCompletedTasks: 1 },
                autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
                isActive: true
            },
            {
                fromStage: LeadStage.CONTACTED,
                toStage: LeadStage.QUALIFIED,
                criteria: { minScore: 50 },
                autonomyLevel: AutonomyLevel.SUGGEST_APPROVE,
                isActive: true
            },
            {
                fromStage: LeadStage.QUALIFIED,
                toStage: LeadStage.PROPOSAL_SENT,
                criteria: { minScore: 75, minCompletedTasks: 2 },
                autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
                isActive: true
            }
        ]
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Drip Sequences & Steps
    // ──────────────────────────────────────────────────────────────────────────
    console.log('Seeding Drip Sequences...');
    
    await prisma.dripStep.deleteMany();
    await prisma.dripSequence.deleteMany();

    const inboundSequence = await prisma.dripSequence.create({
        data: {
            name: 'Inbound Lead Nurture',
            description: 'Nurture sequence for new inbound leads who have not booked a call.',
            triggerType: 'stage_entered',
            triggerConfig: { stage: 'NEW' },
            stopConditions: { onStageReached: 'CONTACTED', onEmailReply: true },
            autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
            isActive: true,
            steps: {
                create: [
                    {
                        stepOrder: 1,
                        delayHours: 0,
                        subjectTemplate: 'Welcome to Vyntrize! Let\'s chat',
                        bodyTemplate: '<p>Thanks for reaching out! Here is a quick overview of how we help companies like yours scale. Let\'s schedule a 15-min discovery call.</p>',
                        branchCondition: 'always'
                    },
                    {
                        stepOrder: 2,
                        delayHours: 72, // 3 days
                        subjectTemplate: 'How we helped a similar company scale',
                        bodyTemplate: '<p>Hi {{firstName}}, just wanted to share a quick case study on how we helped achieve a 3x ROI for a similar client. Check it out here: [Link].</p>',
                        branchCondition: 'always'
                    },
                    {
                        stepOrder: 3,
                        delayHours: 168, // 7 days
                        subjectTemplate: 'Checking in - still exploring solutions?',
                        bodyTemplate: '<p>Hi {{firstName}}, just bubbling this up. If you are still looking for help with your CRM needs, my calendar is open here: [BookingLink].</p>',
                        branchCondition: 'always'
                    }
                ]
            }
        }
    });

    const proposalSequence = await prisma.dripSequence.create({
        data: {
            name: 'Proposal Follow-Up',
            description: 'Follow-up sequence for leads who have received a proposal.',
            triggerType: 'stage_entered',
            triggerConfig: { stage: 'PROPOSAL_SENT' },
            stopConditions: { onStageReached: 'WON' },
            autonomyLevel: AutonomyLevel.SUGGEST_APPROVE,
            isActive: true,
            steps: {
                create: [
                    {
                        stepOrder: 1,
                        delayHours: 72, // 3 days
                        subjectTemplate: 'Any questions on the proposal?',
                        bodyTemplate: '<p>Hi {{firstName}}, did you have time to review the proposal? Let me know if any questions came up with the team.</p>',
                        branchCondition: 'always'
                    },
                    {
                        stepOrder: 2,
                        delayHours: 168, // 7 days
                        subjectTemplate: 'Gentle reminder: Proposal timeline',
                        bodyTemplate: '<p>Quick reminder on the timeline: if we start by next week, we can hit our goal for this quarter.</p>',
                        branchCondition: 'always'
                    }
                ]
            }
        }
    });

    console.log('✅ Automation Seed Completed Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
