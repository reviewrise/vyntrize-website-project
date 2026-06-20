import 'dotenv/config';
import { prisma } from '@/lib/prisma';

const templates = [
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
