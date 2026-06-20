import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  // Welcome Email
  {
    name: 'Welcome Email',
    type: 'WELCOME',
    subject: 'Welcome to {{companyName}}, {{firstName}}!',
    body: `
<p>Hi {{firstName}},</p>
<p>Thank you for reaching out to us! We're excited to connect with you and learn more about how we can help {{companyName}} achieve its goals.</p>
<p>Our team is reviewing your inquiry and will get back to you within 24 hours. In the meantime, feel free to explore our resources or schedule a call at your convenience.</p>
<p><a href="{{scheduleLink}}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Schedule a Call</a></p>
<p>Looking forward to speaking with you soon!</p>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Your company name',
      scheduleLink: 'Link to scheduling page',
      companyAddress: 'Your company address',
    },
    isShared: true,
  },

  // Initial Outreach
  {
    name: 'Initial Outreach',
    type: 'INITIAL_OUTREACH',
    subject: 'Quick question about {{companyName}}',
    body: `
<p>Hi {{firstName}},</p>
<p>I came across {{companyName}} and was impressed by {{specificDetail}}. I wanted to reach out because I believe we could help you {{valueProposition}}.</p>
<p>We've helped companies like {{similarCompany}} achieve:</p>
<ul>
  <li>{{benefit1}}</li>
  <li>{{benefit2}}</li>
  <li>{{benefit3}}</li>
</ul>
<p>Would you be open to a quick 15-minute call next week to explore if this could be valuable for {{companyName}}?</p>
<p><a href="{{calendarLink}}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Book a Time</a></p>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Company name',
      specificDetail: 'Personalized detail',
      valueProposition: 'Core value prop',
      similarCompany: 'Reference customer',
      benefit1: 'Key benefit 1',
      benefit2: 'Key benefit 2',
      benefit3: 'Key benefit 3',
      calendarLink: 'Calendar booking link',
      senderName: 'Your name',
      senderTitle: 'Your title',
    },
    isShared: true,
  },

  // Follow-up 1
  {
    name: 'Follow-up (Value Add)',
    type: 'FOLLOW_UP',
    subject: 'Resources for {{companyName}}',
    body: `
<p>Hi {{firstName}},</p>
<p>I'm following up on my previous note. I know things can get busy, so I'll keep this brief.</p>
<p>I thought you might find this {{resourceType}} interesting, as it addresses how teams in {{industry}} are solving {{painPoint}}:</p>
<p><a href="{{resourceLink}}" style="font-weight: 500;">{{resourceName}}</a></p>
<p>I'd love to hear your thoughts on it. Do you have a few minutes next {{dayOfWeek}} to connect?</p>
<p><a href="{{calendarLink}}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Schedule a Call</a></p>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Company name',
      resourceType: 'Type of resource (e.g. guide, case study)',
      industry: 'Industry',
      painPoint: 'Key pain point',
      resourceName: 'Name of the resource',
      resourceLink: 'Link to the resource',
      dayOfWeek: 'Suggested day',
      calendarLink: 'Calendar link',
      senderName: 'Your name',
    },
    isShared: true,
  },

  // Meeting Confirmation
  {
    name: 'Meeting Confirmation',
    type: 'MEETING_CONFIRMATION',
    subject: 'Confirmed: Meeting with {{companyName}}',
    body: `
<p>Hi {{firstName}},</p>
<p>This is a quick note to confirm our meeting scheduled for {{meetingDate}} at {{meetingTime}}.</p>
<p>We'll be meeting via {{meetingLocation}}.</p>
<p>To make the most of our time, I've prepared a brief agenda:</p>
<ul>
  <li>Brief introductions</li>
  <li>Discuss your goals for {{topic}}</li>
  <li>Overview of how we might help</li>
  <li>Next steps</li>
</ul>
<p>If you need to reschedule, please let me know or use this <a href="{{rescheduleLink}}">link</a>.</p>
<p>Looking forward to our conversation!</p>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Company name',
      meetingDate: 'Date of meeting',
      meetingTime: 'Time of meeting',
      meetingLocation: 'Location or Zoom link',
      topic: 'Main topic of discussion',
      rescheduleLink: 'Link to reschedule',
      senderName: 'Your name',
    },
    isShared: true,
  },

  // Post-Meeting Summary
  {
    name: 'Post-Meeting Summary',
    type: 'MEETING_FOLLOW_UP',
    subject: 'Great speaking with you, {{firstName}}',
    body: `
<p>Hi {{firstName}},</p>
<p>Thanks for taking the time to speak with me today. I really enjoyed learning more about {{companyName}} and your current focus on {{topic}}.</p>
<p>As discussed, here is a quick summary of our conversation and next steps:</p>
<p><strong>Key Takeaways:</strong></p>
<ul>
  <li>{{takeaway1}}</li>
  <li>{{takeaway2}}</li>
</ul>
<p><strong>Next Steps:</strong></p>
<ul>
  <li>{{nextStep1}}</li>
  <li>{{nextStep2}}</li>
</ul>
<p>I've attached the materials we reviewed for your reference. Let me know if you have any questions before our next check-in on {{nextMeetingDate}}.</p>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Company name',
      topic: 'Main topic discussed',
      takeaway1: 'Key takeaway 1',
      takeaway2: 'Key takeaway 2',
      nextStep1: 'Next step 1',
      nextStep2: 'Next step 2',
      nextMeetingDate: 'Date of next meeting',
      senderName: 'Your name',
    },
    isShared: true,
  },

  // Breakup Email
  {
    name: 'Breakup (Final Attempt)',
    type: 'BREAKUP',
    subject: 'Closing the loop - {{companyName}}',
    body: `
<p>Hi {{firstName}},</p>
<p>I haven't heard back from you, so I'll assume that {{topic}} isn't a priority for {{companyName}} right now.</p>
<p>Timing is everything, and I don't want to keep clogging up your inbox. This will be my last email for now.</p>
<p>If things change in the future and you'd like to explore how we can help with {{additionalContext}}, please don't hesitate to reach out.</p>
<p>You can always book a time directly on my calendar here: <a href="{{meetingLink}}">{{meetingLink}}</a></p>
<p>Wishing you and the team at {{companyName}} all the best!</p>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Company name',
      topic: 'Email topic',
      additionalContext: 'Additional context',
      meetingLink: 'Meeting link',
      senderName: 'Your name',
    },
    isShared: true,
  },
];

async function main() {
  console.log('🌱 Seeding email templates...');

  const adminUser = await prisma.crmUser.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.error('❌ No admin user found. Please create an admin user first.');
    process.exit(1);
  }

  console.log(`📧 Creating ${templates.length} email templates...`);

  for (const template of templates) {
    await prisma.emailTemplate.create({
      data: {
        ...template,
        userId: adminUser.id,
      },
    });
  }

  console.log('✅ Email templates seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
