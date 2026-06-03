import { vyntrizeDb } from '../src/client';
import { LeadStage, AutonomyLevel } from '../src/generated/client';

async function main() {
  console.log('🌱 Seeding operational workflows...');
  const prisma = vyntrizeDb;

  try {
    // 1. Pipeline Stages
    console.log('📊 Creating Pipeline Stages...');
    const stages = [
      { name: 'NEW', stageOrder: 1, probability: 0, description: 'Newly acquired lead' },
      { name: 'CONTACTED', stageOrder: 2, probability: 10, description: 'Initial outreach made' },
      { name: 'QUALIFIED', stageOrder: 3, probability: 30, description: 'Lead has shown interest and is qualified' },
      { name: 'PROPOSAL_SENT', stageOrder: 4, probability: 60, description: 'Proposal or quote has been sent' },
      { name: 'WON', stageOrder: 5, probability: 100, description: 'Deal won' },
      { name: 'LOST', stageOrder: 6, probability: 0, description: 'Deal lost' }
    ];

    for (const stage of stages) {
      await prisma.pipelineStage.upsert({
        where: { stageOrder: stage.stageOrder },
        update: stage,
        create: stage
      });
    }

    // 2. Stage Progression Rules
    console.log('🔄 Creating Stage Progression Rules...');
    
    await prisma.stageProgressionRule.create({
      data: {
        fromStage: LeadStage.NEW,
        toStage: LeadStage.CONTACTED,
        criteria: { event: 'email_sent' },
        autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS
      }
    });

    await prisma.stageProgressionRule.create({
      data: {
        fromStage: LeadStage.CONTACTED,
        toStage: LeadStage.QUALIFIED,
        criteria: { event: 'email_replied' },
        autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS
      }
    });

    await prisma.stageProgressionRule.create({
      data: {
        fromStage: LeadStage.QUALIFIED,
        toStage: LeadStage.PROPOSAL_SENT,
        criteria: { event: 'deal_created' },
        autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS
      }
    });

    await prisma.stageProgressionRule.create({
      data: {
        fromStage: LeadStage.PROPOSAL_SENT,
        toStage: LeadStage.WON,
        criteria: { event: 'deal_won' },
        autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS
      }
    });

    // 3. Workflow Rules
    console.log('⚙️ Creating Workflow Rules...');
    await prisma.workflowRule.create({
      data: {
        name: 'High-Value Lead Alert',
        description: 'Create an urgent task when lead score exceeds 80',
        triggerEvent: 'score_updated',
        conditions: [{ field: 'score', operator: '>', value: 80 }],
        actions: [{ type: 'create_task', config: { priority: 'URGENT', title: 'Contact High-Value Lead' } }],
        autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS
      }
    });

    await prisma.workflowRule.create({
      data: {
        name: 'Hot Lead Engagement',
        description: 'Notify assigned user when a lead clicks a link in a proposal email',
        triggerEvent: 'email_clicked',
        conditions: [{ field: 'email_type', operator: '==', value: 'PROPOSAL' }],
        actions: [{ type: 'alert_owner', config: { message: 'Lead just clicked a link in your proposal!' } }],
        autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS
      }
    });

    // 4. Drip Sequences
    console.log('💧 Creating Drip Sequences...');
    const welcomeSequence = await prisma.dripSequence.create({
      data: {
        name: 'Inbound Lead Welcome Sequence',
        description: 'Triggered when a new lead comes from the website contact form',
        triggerType: 'lead_created',
        triggerConfig: { source: 'website' },
        stopConditions: { events: ['email_replied', 'call_logged'] },
        autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS
      }
    });

    await prisma.dripStep.createMany({
      data: [
        {
          sequenceId: welcomeSequence.id,
          stepOrder: 1,
          delayHours: 0,
          subjectTemplate: 'Welcome to VyntRise',
          bodyTemplate: 'Hi {{firstName}}, thank you for reaching out! We received your inquiry and will be in touch shortly.',
          branchCondition: 'default'
        },
        {
          sequenceId: welcomeSequence.id,
          stepOrder: 2,
          delayHours: 48,
          subjectTemplate: 'Following up on your inquiry',
          bodyTemplate: 'Hi {{firstName}}, did you have a chance to look over the materials we sent? Let me know if you have any questions!',
          branchCondition: 'default'
        },
        {
          sequenceId: welcomeSequence.id,
          stepOrder: 3,
          delayHours: 72,
          subjectTemplate: 'How VyntRise helps companies like yours',
          bodyTemplate: 'Hi {{firstName}}, I wanted to share a quick case study of how we helped a similar company scale their operations.',
          branchCondition: 'default'
        }
      ]
    });

    const reEngagementSequence = await prisma.dripSequence.create({
      data: {
        name: 'Cold Lead Re-engagement',
        description: 'Triggered when a lead has been inactive for >30 days',
        triggerType: 'inactivity',
        triggerConfig: { days_inactive: 30 },
        stopConditions: { events: ['email_replied', 'email_opened'] },
        autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS
      }
    });

    await prisma.dripStep.createMany({
      data: [
        {
          sequenceId: reEngagementSequence.id,
          stepOrder: 1,
          delayHours: 0,
          subjectTemplate: 'Checking in',
          bodyTemplate: 'Hi {{firstName}}, just checking in to see if you are still looking for help with {{intent}}?',
          branchCondition: 'default'
        },
        {
          sequenceId: reEngagementSequence.id,
          stepOrder: 2,
          delayHours: 72,
          subjectTemplate: 'Closing your file',
          bodyTemplate: 'Hi {{firstName}}, I haven\'t heard back so I will assume you went in another direction. I\'ll close your file for now, but feel free to reach out if things change!',
          branchCondition: 'default'
        }
      ]
    });

    console.log('✅ Operational workflows seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding operational workflows:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
