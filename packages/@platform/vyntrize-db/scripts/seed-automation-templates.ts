/**
 * Seed Automation Templates (Email + SMS) + Drip Sequences
 * Run: pnpm --filter @platform/vyntrize-db seed:automation-templates
 *  or: npx tsx scripts/seed-automation-templates.ts (from within the package dir)
 *
 * Variable reference (resolved automatically by ContextBuilder):
 *   {{contact.firstName}}   — Contact first name
 *   {{contact.lastName}}    — Contact last name
 *   {{contact.name}}        — Full name
 *   {{contact.email}}       — Contact email
 *   {{company.name}}        — Company name
 *   {{lead.title}}          — Lead/deal title
 *   {{user.name}}           — Assigned rep name
 *   {{user.email}}          — Assigned rep email
 *   {{user.bookingLink}}    — Rep's booking page URL
 *   {{unsubscribeUrl}}      — Email unsubscribe link
 *   {{optOutUrl}}           — SMS opt-out link
 *   {{date}} / {{time}}     — Current date / time
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
    subject: 'Welcome to Vyntrize, {{contact.firstName}}!',
    body: `<p>Hi {{contact.firstName}},</p>
<p>Thank you for reaching out! We're excited to connect with you and learn more about how we can help{{#if company.name}} {{company.name}}{{/if}}.</p>
<p>One of our team members will be in touch with you shortly.</p>
<p>Best regards,<br/>{{user.name}}</p>
<p style="font-size:11px;color:#999;"><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>`,
    type: 'WELCOME' as const,
    isShared: true,
    variables: ['contact.firstName', 'company.name', 'user.name', 'unsubscribeUrl'],
  },
  {
    name: 'Contact Us – Confirmation',
    subject: "We've received your message, {{contact.firstName}}!",
    body: `<p>Hi {{contact.firstName}},</p>
<p>Thank you for getting in touch with us! We've received your message and one of our team members will reach out within 1 business day.</p>
<p>We look forward to speaking with you soon!</p>
<p>Best regards,<br/>{{user.name}}</p>
<p style="font-size:11px;color:#999;"><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>`,
    type: 'GENERAL' as const,
    isShared: true,
    variables: ['contact.firstName', 'user.name', 'unsubscribeUrl'],
  },
  {
    name: 'Initial Outreach',
    subject: 'Quick question for you, {{contact.firstName}}',
    body: `<p>Hi {{contact.firstName}},</p>
<p>I noticed you recently got in touch and wanted to personally reach out. I'd love to learn more about your goals{{#if company.name}} at {{company.name}}{{/if}} and see if we can help.</p>
<p>Would you be open to a quick 15-minute call this week?</p>
<p><a href="{{user.bookingLink}}">Book a time that works for you →</a></p>
<p>Looking forward to connecting!<br/>{{user.name}}</p>
<p style="font-size:11px;color:#999;"><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>`,
    type: 'INITIAL_OUTREACH' as const,
    isShared: true,
    variables: ['contact.firstName', 'company.name', 'user.name', 'user.bookingLink', 'unsubscribeUrl'],
  },
  {
    name: 'Follow-up After Meeting',
    subject: 'Great connecting with you, {{contact.firstName}}!',
    body: `<p>Hi {{contact.firstName}},</p>
<p>It was a pleasure speaking with you earlier. I wanted to follow up and summarise the key points we discussed.</p>
<p>As a next step, I'll send over a tailored proposal. Please let me know if you have any questions in the meantime.</p>
<p>Thanks again for your time!<br/>{{user.name}}</p>
<p style="font-size:11px;color:#999;"><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>`,
    type: 'FOLLOW_UP' as const,
    isShared: true,
    variables: ['contact.firstName', 'user.name', 'unsubscribeUrl'],
  },
  {
    name: 'Proposal Sent',
    subject: "Here's your proposal, {{contact.firstName}}",
    body: `<p>Hi {{contact.firstName}},</p>
<p>Please find attached the proposal we discussed{{#if company.name}} for {{company.name}}{{/if}}. I've tailored it specifically to meet your requirements.</p>
<p>I'd love to walk you through it on a quick call — just let me know a time that suits you.</p>
<p><a href="{{user.bookingLink}}">Schedule a walkthrough →</a></p>
<p>Looking forward to your feedback!<br/>{{user.name}}</p>
<p style="font-size:11px;color:#999;"><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>`,
    type: 'PROPOSAL' as const,
    isShared: true,
    variables: ['contact.firstName', 'company.name', 'user.name', 'user.bookingLink', 'unsubscribeUrl'],
  },
  {
    name: 'Re-engagement',
    subject: "We haven't forgotten about you, {{contact.firstName}}",
    body: `<p>Hi {{contact.firstName}},</p>
<p>I wanted to check in since it's been a little while since we last spoke. I know things can get busy!</p>
<p>We've made some exciting updates recently that I think would be a great fit{{#if company.name}} for {{company.name}}{{/if}}. Would you be open to a quick catch-up?</p>
<p><a href="{{user.bookingLink}}">Book a time here →</a></p>
<p>Either way, feel free to reach out anytime.<br/>{{user.name}}</p>
<p style="font-size:11px;color:#999;"><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>`,
    type: 'RE_ENGAGEMENT' as const,
    isShared: true,
    variables: ['contact.firstName', 'company.name', 'user.name', 'user.bookingLink', 'unsubscribeUrl'],
  },
  {
    name: 'Stage Change – Qualified',
    subject: "Great news, {{contact.firstName}} — you've been qualified!",
    body: `<p>Hi {{contact.firstName}},</p>
<p>We've reviewed your details and are excited to move forward with {{lead.title}}.</p>
<p>Your dedicated rep, {{user.name}}, will be reaching out very soon to discuss next steps.</p>
<p>In the meantime, feel free to book a call directly:</p>
<p><a href="{{user.bookingLink}}">Book a call →</a></p>
<p style="font-size:11px;color:#999;"><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>`,
    type: 'STAGE_CHANGE' as const,
    isShared: true,
    variables: ['contact.firstName', 'lead.title', 'user.name', 'user.bookingLink', 'unsubscribeUrl'],
  },
  {
    name: 'Email Opened – Engagement Response',
    subject: "Saw you checking us out, {{contact.firstName}} 👋",
    body: `<p>Hi {{contact.firstName}},</p>
<p>I noticed you recently opened one of our emails and wanted to personally reach out.</p>
<p>If you have any questions or want to explore how we can help{{#if company.name}} {{company.name}}{{/if}}, I'd love to chat!</p>
<p><a href="{{user.bookingLink}}">Book a 15-minute call →</a></p>
<p>Looking forward to hearing from you!<br/>{{user.name}}</p>
<p style="font-size:11px;color:#999;"><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>`,
    type: 'ENGAGEMENT_RESPONSE' as const,
    isShared: true,
    variables: ['contact.firstName', 'company.name', 'user.name', 'user.bookingLink', 'unsubscribeUrl'],
  },
];

// ─── SMS Templates ────────────────────────────────────────────────────────────

const smsTemplates = [
  {
    name: 'Contact Auto-Reply',
    body: "Hi {{contact.firstName}}, thanks for reaching out to Vyntrize! We've received your message and will be in touch shortly.",
    type: 'CONFIRMATION' as const,
    isShared: true,
    variables: ['contact.firstName'],
  },
  {
    name: 'Welcome – New Lead',
    body: "Hi {{contact.firstName}}, welcome! We're excited to connect with you. {{user.name}} from our team will reach out soon.",
    type: 'WELCOME' as const,
    isShared: true,
    variables: ['contact.firstName', 'user.name'],
  },
  {
    name: 'Meeting Link Notification',
    body: 'Hi {{contact.firstName}}, {{user.name}} just sent you a calendar invite! Check your email for the meeting details.',
    type: 'MEETING_INVITE' as const,
    isShared: true,
    variables: ['contact.firstName', 'user.name'],
  },
  {
    name: 'Follow-up Reminder',
    body: "Hi {{contact.firstName}}, just checking in! We'd love to continue the conversation. Book a call here: {{user.bookingLink}}. Reply STOP to opt out.",
    type: 'FOLLOW_UP' as const,
    isShared: true,
    variables: ['contact.firstName', 'user.bookingLink'],
  },
  {
    name: 'Initial Outreach',
    body: 'Hi {{contact.firstName}}, this is {{user.name}} from Vyntrize. Would you be open to a quick 15-min call? Book here: {{user.bookingLink}}. Reply STOP to opt out.',
    type: 'INITIAL_OUTREACH' as const,
    isShared: true,
    variables: ['contact.firstName', 'user.name', 'user.bookingLink'],
  },
  {
    name: 'Re-engagement',
    body: "Hi {{contact.firstName}}, we haven't spoken in a while! We've got exciting updates — would love to reconnect. Reply STOP to opt out.",
    type: 'RE_ENGAGEMENT' as const,
    isShared: true,
    variables: ['contact.firstName'],
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
