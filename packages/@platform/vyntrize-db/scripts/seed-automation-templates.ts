/**
 * Seed Automation Templates (Email + SMS)
 * Run: pnpm --filter @platform/vyntrize-db seed:automation-templates
 *  or: npx tsx scripts/seed-automation-templates.ts (from within the package dir)
 */

import { vyntrizeDb } from '../src/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = vyntrizeDb;

// ─── Email Templates ──────────────────────────────────────────────────────────

const emailTemplates = [
  {
    name: 'Welcome – New Lead',
    subject: 'Welcome to Vyntrize, {{firstName}}!',
    body: `<p>Hi {{firstName}},</p>
<p>Thank you for reaching out! We're excited to connect with you and learn more about how we can help{{#if company}} {{company}}{{/if}}.</p>
<p>One of our team members will be in touch with you shortly.</p>
<p>Best regards,<br/>The Vyntrize Team</p>`,
    type: 'WELCOME' as const,
    isShared: true,
    variables: ['firstName', 'company'],
  },
  {
    name: 'Contact Us – Confirmation',
    subject: "We've received your message, {{firstName}}!",
    body: `<p>Hi {{firstName}},</p>
<p>Thank you for getting in touch with us! We've received your message and one of our team members will reach out within 1 business day.</p>
<p>We look forward to speaking with you soon!</p>
<p>Best regards,<br/>The Vyntrize Team</p>`,
    type: 'GENERAL' as const,
    isShared: true,
    variables: ['firstName'],
  },
  {
    name: 'Initial Outreach',
    subject: 'Quick question for you, {{firstName}}',
    body: `<p>Hi {{firstName}},</p>
<p>I noticed you recently got in touch and wanted to personally reach out. I'd love to learn more about your goals{{#if company}} at {{company}}{{/if}} and see if we can help.</p>
<p>Would you be open to a quick 15-minute call this week?</p>
<p>Looking forward to connecting!</p>`,
    type: 'INITIAL_OUTREACH' as const,
    isShared: true,
    variables: ['firstName', 'company'],
  },
  {
    name: 'Follow-up After Meeting',
    subject: 'Great connecting with you, {{firstName}}!',
    body: `<p>Hi {{firstName}},</p>
<p>It was a pleasure speaking with you earlier. I wanted to follow up and summarise the key points we discussed.</p>
<p>As a next step, I'll send over a tailored proposal. Please let me know if you have any questions in the meantime.</p>
<p>Thanks again for your time!</p>`,
    type: 'FOLLOW_UP' as const,
    isShared: true,
    variables: ['firstName'],
  },
  {
    name: 'Proposal Sent',
    subject: "Here's your proposal, {{firstName}}",
    body: `<p>Hi {{firstName}},</p>
<p>Please find attached the proposal we discussed{{#if company}} for {{company}}{{/if}}. I've tailored it specifically to meet your requirements.</p>
<p>I'd love to walk you through it on a quick call — just let me know a time that suits you.</p>
<p>Looking forward to your feedback!</p>`,
    type: 'PROPOSAL' as const,
    isShared: true,
    variables: ['firstName', 'company'],
  },
  {
    name: 'Re-engagement',
    subject: "We haven't forgotten about you, {{firstName}}",
    body: `<p>Hi {{firstName}},</p>
<p>I wanted to check in since it's been a little while since we last spoke. I know things can get busy!</p>
<p>We've made some exciting updates recently that I think would be a great fit{{#if company}} for {{company}}{{/if}}. Would you be open to a quick catch-up?</p>
<p>Either way, feel free to reach out anytime.</p>`,
    type: 'RE_ENGAGEMENT' as const,
    isShared: true,
    variables: ['firstName', 'company'],
  },
];

// ─── SMS Templates ────────────────────────────────────────────────────────────

const smsTemplates = [
  {
    name: 'Contact Auto-Reply',
    body: "Hi {{firstName}}, thanks for reaching out to Vyntrize! We've received your message and will be in touch shortly.",
    type: 'CONFIRMATION' as const,
    isShared: true,
    variables: ['firstName'],
  },
  {
    name: 'Welcome – New Lead',
    body: "Hi {{firstName}}, welcome! We're excited to connect with you. One of our team will reach out soon.",
    type: 'WELCOME' as const,
    isShared: true,
    variables: ['firstName'],
  },
  {
    name: 'Meeting Link Notification',
    body: 'Hi {{firstName}}, {{senderName}} just sent you a calendar invite! Check your email for the meeting details.',
    type: 'MEETING_INVITE' as const,
    isShared: true,
    variables: ['firstName', 'senderName'],
  },
  {
    name: 'Follow-up Reminder',
    body: "Hi {{firstName}}, just checking in! We'd love to continue the conversation. Reply anytime or book a call: {{bookingUrl}}",
    type: 'FOLLOW_UP' as const,
    isShared: true,
    variables: ['firstName', 'bookingUrl'],
  },
  {
    name: 'Initial Outreach',
    body: 'Hi {{firstName}}, this is {{senderName}} from Vyntrize. Would you be open to a quick 15-minute call to explore how we can help?',
    type: 'INITIAL_OUTREACH' as const,
    isShared: true,
    variables: ['firstName', 'senderName'],
  },
  {
    name: 'Re-engagement',
    body: "Hi {{firstName}}, we haven't spoken in a while! We've got some exciting updates — would love to reconnect when you get a chance.",
    type: 'RE_ENGAGEMENT' as const,
    isShared: true,
    variables: ['firstName'],
  },
];

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📧 Seeding Email Templates...');
  for (const tpl of emailTemplates) {
    const existing = await prisma.emailTemplate.findFirst({ where: { name: tpl.name } });
    if (existing) {
      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: { subject: tpl.subject, body: tpl.body, type: tpl.type, isShared: tpl.isShared, variables: tpl.variables },
      });
      console.log(`  🔄  Updated: "${tpl.name}"`);
    } else {
      await prisma.emailTemplate.create({ data: tpl });
      console.log(`  ✅  Created: "${tpl.name}"`);
    }
  }

  console.log('\n💬 Seeding SMS Templates...');
  for (const tpl of smsTemplates) {
    const existing = await vyntrizeDb.smsTemplate.findFirst({ where: { name: tpl.name } });
    if (existing) {
      await vyntrizeDb.smsTemplate.update({
        where: { id: existing.id },
        data: { body: tpl.body, type: tpl.type, isShared: tpl.isShared, variables: tpl.variables },
      });
      console.log(`  🔄  Updated: "${tpl.name}"`);
    } else {
      await vyntrizeDb.smsTemplate.create({ data: tpl });
      console.log(`  ✅  Created: "${tpl.name}"`);
    }
  }

  console.log('\n✅ All automation templates seeded!\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
