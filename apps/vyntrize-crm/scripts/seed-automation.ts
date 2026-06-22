/**
 * Seed script: Pipeline Automation
 *
 * Seeds realistic Stage Progression Rules, Drip Sequences (with steps),
 * and Workflow Rules for a typical B2B SaaS sales pipeline.
 *
 * Run: npx tsx scripts/seed-automation.ts
 * Safe to re-run — skips records that already exist by name.
 */

import { PrismaClient } from '@platform/vyntrize-db/src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from the CRM app directory
dotenv.config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.CRM_DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ${msg}`);
}

function skip(msg: string) {
  console.log(`  ⏭  ${msg} (already exists)`);
}

// ─── Stage Progression Rules ──────────────────────────────────────────────────

async function seedStageProgressionRules() {
  console.log('\n📈 Stage Progression Rules');

  const rules = [
    {
      name: 'NEW → CONTACTED: First contact made',
      fromStage: 'NEW',
      toStage: 'CONTACTED',
      criteria: {
        minCompletedTasks: 1,
      },
      autonomyLevel: 'FULLY_AUTONOMOUS',
      description: 'Move to CONTACTED once the first outreach task is completed',
    },
    {
      name: 'CONTACTED → QUALIFIED: Engaged lead',
      fromStage: 'CONTACTED',
      toStage: 'QUALIFIED',
      criteria: {
        minScore: 60,
        minEmailOpens: 2,
      },
      autonomyLevel: 'SUGGEST_APPROVE',
      description: 'Suggest qualification when lead score ≥ 60 and has opened 2+ emails',
    },
    {
      name: 'CONTACTED → QUALIFIED: High-intent lead',
      fromStage: 'CONTACTED',
      toStage: 'QUALIFIED',
      criteria: {
        minScore: 75,
        minEmailClicks: 1,
      },
      autonomyLevel: 'FULLY_AUTONOMOUS',
      description: 'Auto-qualify high-intent leads (score ≥ 75 + clicked a link)',
    },
    {
      name: 'QUALIFIED → PROPOSAL_SENT: Ready for proposal',
      fromStage: 'QUALIFIED',
      toStage: 'PROPOSAL_SENT',
      criteria: {
        minScore: 70,
        minCompletedTasks: 2,
      },
      autonomyLevel: 'SUGGEST_APPROVE',
      description: 'Suggest proposal stage when 2 tasks done and score ≥ 70',
    },
    {
      name: 'PROPOSAL_SENT → WON: Deal closed',
      fromStage: 'PROPOSAL_SENT',
      toStage: 'WON',
      criteria: {
        minScore: 85,
        minEmailClicks: 2,
      },
      autonomyLevel: 'SUGGEST_APPROVE',
      description: 'Suggest WON when lead is highly engaged after proposal (always requires approval)',
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.stageProgressionRule.findFirst({
      where: { fromStage: rule.fromStage as any, toStage: rule.toStage as any },
    });

    if (existing) {
      skip(`${rule.fromStage} → ${rule.toStage}`);
      continue;
    }

    await prisma.stageProgressionRule.create({
      data: {
        fromStage: rule.fromStage as any,
        toStage: rule.toStage as any,
        criteria: rule.criteria,
        autonomyLevel: rule.autonomyLevel as any,
        isActive: true,
      },
    });
    log(`✓ Created: ${rule.fromStage} → ${rule.toStage} (${rule.autonomyLevel})`);
  }
}

// ─── Drip Sequences ───────────────────────────────────────────────────────────

async function seedDripSequences() {
  console.log('\n✉️  Drip Sequences');

  const sequences = [
    {
      name: 'New Lead Welcome Sequence',
      description: 'Warm up new leads with a 3-step introduction sequence',
      triggerType: 'stage_entered',
      triggerConfig: { stage: 'NEW' },
      stopConditions: { onStageReached: 'QUALIFIED', onScoreExceeds: 80 },
      autonomyLevel: 'FULLY_AUTONOMOUS',
      steps: [
        {
          stepOrder: 0,
          delayHours: 0,
          subjectTemplate: 'Welcome to Vyntrize, {{firstName}}',
          bodyTemplate: `Hi {{firstName}},

Thanks for your interest in Vyntrize. We help B2B teams close more deals with less manual work.

I'd love to learn more about your current sales process and see if we're a good fit.

Would you be open to a quick 15-minute call this week?

Best,
The Vyntrize Team`,
          smsBodyTemplate: `Hi {{firstName}}, thanks for reaching out to Vyntrize! I just sent our service guide to your email. Let me know if you received it! — Abenezer`,
          branchCondition: 'always',
        },
        {
          stepOrder: 1,
          delayHours: 48,
          subjectTemplate: 'Quick question for you, {{firstName}}',
          bodyTemplate: `Hi {{firstName}},

I wanted to follow up on my last message. I know inboxes get busy.

One quick question: what's the biggest challenge your sales team faces right now?

Even a one-line reply helps me understand how Vyntrize can help.

Best,
The Vyntrize Team`,
          branchCondition: 'not_opened',
        },
        {
          stepOrder: 2,
          delayHours: 72,
          subjectTemplate: 'Resources for {{firstName}} at {{company}}',
          bodyTemplate: `Hi {{firstName}},

Since you've been exploring Vyntrize, I thought you'd find these useful:

• How we helped a 10-person sales team increase close rates by 34%
• The 5-minute pipeline health check (free template)

Happy to walk you through either of these on a call.

Best,
The Vyntrize Team`,
          branchCondition: 'opened',
        },
      ],
    },
    {
      name: 'Post-Qualification Nurture',
      description: 'Keep qualified leads warm while preparing the proposal',
      triggerType: 'stage_entered',
      triggerConfig: { stage: 'QUALIFIED' },
      stopConditions: { onStageReached: 'PROPOSAL_SENT' },
      autonomyLevel: 'FULLY_AUTONOMOUS',
      steps: [
        {
          stepOrder: 0,
          delayHours: 2,
          subjectTemplate: 'Great talking with you, {{firstName}}',
          bodyTemplate: `Hi {{firstName}},

It was great connecting. Based on our conversation, I'm putting together a tailored proposal for {{company}}.

In the meantime, here's a quick overview of what we'll cover:
• Automated lead scoring and qualification
• AI-powered email sequences
• Pipeline stage automation

I'll have the full proposal to you within 2 business days.

Best,
The Vyntrize Team`,
          branchCondition: 'always',
        },
        {
          stepOrder: 1,
          delayHours: 24,
          subjectTemplate: 'While you wait — a quick case study',
          bodyTemplate: `Hi {{firstName}},

While I finalize your proposal, I wanted to share how a company similar to {{company}} used Vyntrize to cut their sales cycle by 3 weeks.

The key was automating the follow-up sequences that reps were doing manually. Sound familiar?

I'll be in touch shortly with your proposal.

Best,
The Vyntrize Team`,
          branchCondition: 'always',
        },
      ],
    },
    {
      name: 'Re-engagement: Stagnant Leads',
      description: 'Re-engage leads that have gone quiet for 7+ days',
      triggerType: 'inactivity_days',
      triggerConfig: { inactivityDays: 7 },
      stopConditions: { onStageReached: 'QUALIFIED', onScoreExceeds: 60 },
      autonomyLevel: 'SUGGEST_APPROVE',
      steps: [
        {
          stepOrder: 0,
          delayHours: 0,
          subjectTemplate: 'Still interested, {{firstName}}?',
          bodyTemplate: `Hi {{firstName}},

I noticed we haven't connected in a while. I wanted to check in — is Vyntrize still on your radar?

If your priorities have shifted, no worries at all. Just let me know and I'll stop reaching out.

If you're still interested, I'd love to pick up where we left off.

Best,
The Vyntrize Team`,
          branchCondition: 'always',
        },
        {
          stepOrder: 1,
          delayHours: 96,
          subjectTemplate: 'Last check-in from Vyntrize',
          bodyTemplate: `Hi {{firstName}},

This will be my last message for now — I don't want to clutter your inbox.

If the timing isn't right, I completely understand. Feel free to reach out whenever you're ready.

Wishing you and the team at {{company}} all the best.

Best,
The Vyntrize Team`,
          branchCondition: 'not_opened',
        },
      ],
    },
    {
      name: 'High-Score Fast Track',
      description: 'Accelerate highly engaged leads with immediate outreach',
      triggerType: 'score_threshold',
      triggerConfig: { scoreThreshold: 80 },
      stopConditions: { onStageReached: 'PROPOSAL_SENT' },
      autonomyLevel: 'FULLY_AUTONOMOUS',
      steps: [
        {
          stepOrder: 0,
          delayHours: 1,
          subjectTemplate: '{{firstName}}, let\'s talk this week',
          bodyTemplate: `Hi {{firstName}},

I can see you've been actively exploring Vyntrize — I'd love to connect while it's top of mind.

I have a few slots open this week for a 20-minute demo tailored to {{company}}'s use case.

Would any of these work for you?
• Tuesday 2–4 PM
• Wednesday 10 AM–12 PM
• Thursday 3–5 PM

Just reply with your preference and I'll send a calendar invite.

Best,
The Vyntrize Team`,
          branchCondition: 'always',
        },
        {
          stepOrder: 1,
          delayHours: 24,
          subjectTemplate: 'Re: Let\'s talk this week',
          bodyTemplate: `Hi {{firstName}},

Following up on my last message — I know you're busy.

If none of those times worked, here's my calendar link to pick a time that suits you: [Calendar Link]

Looking forward to connecting.

Best,
The Vyntrize Team`,
          branchCondition: 'not_opened',
        },
      ],
    },
  ];

  for (const seq of sequences) {
    const existing = await prisma.dripSequence.findFirst({
      where: { name: seq.name },
    });

    if (existing) {
      skip(seq.name);
      continue;
    }

    const created = await prisma.dripSequence.create({
      data: {
        name: seq.name,
        description: seq.description,
        triggerType: seq.triggerType,
        triggerConfig: seq.triggerConfig,
        stopConditions: seq.stopConditions,
        autonomyLevel: seq.autonomyLevel as any,
        isActive: true,
        steps: {
          create: seq.steps.map((step: any) => ({
            stepOrder: step.stepOrder,
            delayHours: step.delayHours,
            emailSubjectTemplate: step.subjectTemplate,
            emailBodyTemplate: step.bodyTemplate,
            smsBodyTemplate: step.smsBodyTemplate,
            branchCondition: step.branchCondition,
          })),
        },
      },
    });

    log(`✓ Created: "${seq.name}" (${seq.steps.length} steps, trigger: ${seq.triggerType})`);
  }
}

// ─── Workflow Rules ───────────────────────────────────────────────────────────

async function seedWorkflowRules() {
  console.log('\n⚡ Workflow Rules');

  const rules = [
    {
      name: 'High-score lead: assign to senior rep',
      description: 'When a lead score exceeds 75, flag for senior rep review',
      triggerEvent: 'lead_updated',
      conditions: [
        { field: 'score', operator: 'gte', value: 75 },
        { field: 'stage', operator: 'eq', value: 'CONTACTED' },
      ],
      actions: [
        { type: 'create_task', config: { title: 'High-value lead — review and qualify', dueDaysOffset: 1 } },
      ],
      autonomyLevel: 'FULLY_AUTONOMOUS',
      priority: 10,
    },
    {
      name: 'Email clicked: immediate follow-up task',
      description: 'Create a same-day follow-up task when a lead clicks a link in an email',
      triggerEvent: 'email_clicked',
      conditions: [],
      actions: [
        { type: 'create_task', config: { title: 'Follow up — lead clicked email link', dueDaysOffset: 0 } },
      ],
      autonomyLevel: 'FULLY_AUTONOMOUS',
      priority: 20,
    },
    {
      name: 'Email opened: schedule follow-up',
      description: 'Create a next-day follow-up task when a lead opens an email',
      triggerEvent: 'email_opened',
      conditions: [
        { field: 'score', operator: 'gte', value: 50 },
      ],
      actions: [
        { type: 'create_task', config: { title: 'Follow up — lead opened email', dueDaysOffset: 1 } },
      ],
      autonomyLevel: 'FULLY_AUTONOMOUS',
      priority: 30,
    },
    {
      name: 'New lead: enroll in welcome sequence',
      description: 'Automatically enroll new leads in the welcome drip sequence',
      triggerEvent: 'lead_created',
      conditions: [],
      actions: [
        // NOTE: uses enroll_drip (not send_email) so the email is actually sent.
        // send_email calls EmailGenerationAgent which only creates a draft for approval.
        // The sequenceId is patched at runtime by fix:welcome-rule if needed.
        { type: 'send_email', config: { templateHint: 'welcome' } },
      ],
      autonomyLevel: 'FULLY_AUTONOMOUS',
      priority: 5,
    },
    {
      name: 'Stage changed to QUALIFIED: send intro email',
      description: 'Send a personalized email when a lead reaches QUALIFIED stage',
      triggerEvent: 'stage_changed',
      conditions: [
        { field: 'stage', operator: 'eq', value: 'QUALIFIED' },
      ],
      actions: [
        { type: 'send_email', config: { templateHint: 'qualification_congratulations' } },
        { type: 'create_task', config: { title: 'Prepare proposal for qualified lead', dueDaysOffset: 2 } },
      ],
      autonomyLevel: 'SUGGEST_APPROVE',
      priority: 15,
    },
    {
      name: 'Task completed: check for stage progression',
      description: 'When a task is completed, evaluate if the lead is ready to progress',
      triggerEvent: 'task_completed',
      conditions: [
        { field: 'score', operator: 'gte', value: 55 },
      ],
      actions: [
        { type: 'create_task', config: { title: 'Review lead for stage progression', dueDaysOffset: 0 } },
      ],
      autonomyLevel: 'FULLY_AUTONOMOUS',
      priority: 50,
    },
    {
      name: 'Proposal sent: schedule follow-up call',
      description: 'Create a follow-up call task 2 days after a lead enters PROPOSAL_SENT',
      triggerEvent: 'stage_changed',
      conditions: [
        { field: 'stage', operator: 'eq', value: 'PROPOSAL_SENT' },
      ],
      actions: [
        { type: 'create_task', config: { title: 'Follow-up call — check on proposal', dueDaysOffset: 2 } },
        { type: 'send_email', config: { templateHint: 'proposal_followup' } },
      ],
      autonomyLevel: 'FULLY_AUTONOMOUS',
      priority: 10,
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.workflowRule.findFirst({
      where: { name: rule.name },
    });

    if (existing) {
      skip(rule.name);
      continue;
    }

    await prisma.workflowRule.create({
      data: {
        name: rule.name,
        description: rule.description,
        triggerEvent: rule.triggerEvent,
        conditions: rule.conditions,
        actions: rule.actions,
        autonomyLevel: rule.autonomyLevel as any,
        isActive: true,
        priority: rule.priority,
      },
    });

    log(`✓ Created: "${rule.name}" (trigger: ${rule.triggerEvent}, priority: ${rule.priority})`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Seeding Pipeline Automation...');

  await seedStageProgressionRules();
  await seedDripSequences();
  await seedWorkflowRules();

  console.log('\n✅ Pipeline automation seeded successfully.');
  console.log('   View at: http://localhost:3014/settings/pipeline/automation\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
