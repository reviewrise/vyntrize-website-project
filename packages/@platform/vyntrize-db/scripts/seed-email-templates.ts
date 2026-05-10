/**
 * Seed Email Templates
 * Run: npx tsx scripts/seed-email-templates.ts
 */

import { vyntrizeDb } from '../src/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = vyntrizeDb;

const templates = [
  // Welcome & Onboarding
  {
    name: 'Welcome Email',
    type: 'WELCOME',
    subject: 'Welcome to {{companyName}}, {{firstName}}!',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to {{companyName}}!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for reaching out to us! We're excited to connect with you and learn more about how we can help {{companyName}} achieve its goals.
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Our team is reviewing your inquiry and will get back to you within 24 hours. In the meantime, feel free to explore our resources or schedule a call at your convenience.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{scheduleLink}}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Schedule a Call</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Looking forward to speaking with you soon!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                Best regards,<br>
                <strong>The {{companyName}} Team</strong>
              </p>
              <p style="margin: 10px 0 0; color: #adb5bd; font-size: 12px;">
                {{companyAddress}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                I came across {{companyName}} and was impressed by {{specificDetail}}. I wanted to reach out because I believe we could help you {{valueProposition}}.
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                We've helped companies like {{similarCompany}} achieve:
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                <li>{{benefit1}}</li>
                <li>{{benefit2}}</li>
                <li>{{benefit3}}</li>
              </ul>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Would you be open to a quick 15-minute call next week to explore if this could be valuable for {{companyName}}?
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{calendarLink}}" style="display: inline-block; padding: 14px 32px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Book a Time</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                {{senderName}}<br>
                <span style="color: #6c757d; font-size: 14px;">{{senderTitle}}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Contact company name',
      specificDetail: 'Something specific about their company',
      valueProposition: 'How you can help',
      similarCompany: 'Similar company name',
      benefit1: 'First benefit',
      benefit2: 'Second benefit',
      benefit3: 'Third benefit',
      calendarLink: 'Calendar booking link',
      senderName: 'Your name',
      senderTitle: 'Your title',
    },
    isShared: true,
  },

  // Follow-up After Meeting
  {
    name: 'Follow-up After Meeting',
    type: 'FOLLOW_UP',
    subject: 'Great connecting with you, {{firstName}}!',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for taking the time to meet with me {{meetingDate}}. I really enjoyed learning more about {{companyName}} and your goals for {{specificGoal}}.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">Key Takeaways:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                  <li>{{takeaway1}}</li>
                  <li>{{takeaway2}}</li>
                  <li>{{takeaway3}}</li>
                </ul>
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>Next Steps:</strong>
              </p>
              
              <ol style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                <li>{{nextStep1}}</li>
                <li>{{nextStep2}}</li>
                <li>{{nextStep3}}</li>
              </ol>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                I've attached {{attachmentDescription}} for your review. Please let me know if you have any questions or need any clarification.
              </p>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Looking forward to our next conversation!<br><br>
                {{senderName}}<br>
                <span style="color: #6c757d; font-size: 14px;">{{senderTitle}}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables: {
      firstName: 'Contact first name',
      meetingDate: 'Meeting date',
      companyName: 'Company name',
      specificGoal: 'Their specific goal',
      takeaway1: 'First key takeaway',
      takeaway2: 'Second key takeaway',
      takeaway3: 'Third key takeaway',
      nextStep1: 'First next step',
      nextStep2: 'Second next step',
      nextStep3: 'Third next step',
      attachmentDescription: 'Description of attachment',
      senderName: 'Your name',
      senderTitle: 'Your title',
    },
    isShared: true,
  },

  // Monthly Newsletter
  {
    name: 'Monthly Newsletter',
    type: 'NEWSLETTER',
    subject: '{{monthName}} Newsletter: {{headline}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 24px; font-weight: 700;">{{companyName}} Newsletter</h1>
              <p style="margin: 0; color: #adb5bd; font-size: 14px;">{{monthName}} {{year}}</p>
            </td>
          </tr>
          
          <!-- Hero -->
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; color: #ffffff;">
                <h2 style="margin: 0 0 15px; font-size: 28px; font-weight: 700;">{{headline}}</h2>
                <p style="margin: 0; font-size: 16px; line-height: 1.6; opacity: 0.95;">{{subheadline}}</p>
              </div>
            </td>
          </tr>
          
          <!-- Content Sections -->
          <tr>
            <td style="padding: 40px 30px;">
              <!-- Section 1 -->
              <div style="margin-bottom: 40px;">
                <h3 style="margin: 0 0 15px; color: #333333; font-size: 20px; font-weight: 600;">{{section1Title}}</h3>
                <p style="margin: 0 0 15px; color: #555555; font-size: 15px; line-height: 1.7;">{{section1Content}}</p>
                <a href="{{section1Link}}" style="color: #667eea; text-decoration: none; font-weight: 600; font-size: 15px;">Read more →</a>
              </div>
              
              <!-- Section 2 -->
              <div style="margin-bottom: 40px; padding-top: 30px; border-top: 1px solid #e9ecef;">
                <h3 style="margin: 0 0 15px; color: #333333; font-size: 20px; font-weight: 600;">{{section2Title}}</h3>
                <p style="margin: 0 0 15px; color: #555555; font-size: 15px; line-height: 1.7;">{{section2Content}}</p>
                <a href="{{section2Link}}" style="color: #667eea; text-decoration: none; font-weight: 600; font-size: 15px;">Learn more →</a>
              </div>
              
              <!-- Section 3 -->
              <div style="padding-top: 30px; border-top: 1px solid #e9ecef;">
                <h3 style="margin: 0 0 15px; color: #333333; font-size: 20px; font-weight: 600;">{{section3Title}}</h3>
                <p style="margin: 0 0 15px; color: #555555; font-size: 15px; line-height: 1.7;">{{section3Content}}</p>
                <a href="{{section3Link}}" style="color: #667eea; text-decoration: none; font-weight: 600; font-size: 15px;">Discover more →</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 15px; color: #6c757d; font-size: 14px;">
                Thanks for being part of our community!
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                {{companyName}} | {{companyAddress}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables: {
      companyName: 'Your company name',
      monthName: 'Month name',
      year: 'Year',
      headline: 'Newsletter headline',
      subheadline: 'Newsletter subheadline',
      section1Title: 'First section title',
      section1Content: 'First section content',
      section1Link: 'First section link',
      section2Title: 'Second section title',
      section2Content: 'Second section content',
      section2Link: 'Second section link',
      section3Title: 'Third section title',
      section3Content: 'Third section content',
      section3Link: 'Third section link',
      companyAddress: 'Company address',
    },
    isShared: true,
  },

  // Proposal Sent
  {
    name: 'Proposal Sent',
    type: 'PROPOSAL',
    subject: 'Your custom proposal from {{companyName}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for the opportunity to work with {{companyName}}. I've prepared a custom proposal based on our conversation about {{projectDescription}}.
              </p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
                <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px; font-weight: 600;">Proposal Overview</h2>
                <div style="background-color: rgba(255,255,255,0.1); border-radius: 6px; padding: 20px; margin-bottom: 20px;">
                  <p style="margin: 0 0 10px; color: #ffffff; font-size: 14px; opacity: 0.9;">Investment</p>
                  <p style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">{{proposalAmount}}</p>
                </div>
                <a href="{{proposalLink}}" style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #667eea; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Full Proposal</a>
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>What's Included:</strong>
              </p>
              
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                <li>{{deliverable1}}</li>
                <li>{{deliverable2}}</li>
                <li>{{deliverable3}}</li>
                <li>{{deliverable4}}</li>
              </ul>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>Timeline:</strong> {{timeline}}
              </p>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                I'm confident this solution will help you achieve {{desiredOutcome}}. I'd love to discuss any questions you have about the proposal.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{meetingLink}}" style="display: inline-block; padding: 14px 32px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Schedule a Review Call</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                {{senderName}}<br>
                <span style="color: #6c757d; font-size: 14px;">{{senderTitle}}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Company name',
      projectDescription: 'Project description',
      proposalAmount: 'Proposal amount',
      proposalLink: 'Link to proposal',
      deliverable1: 'First deliverable',
      deliverable2: 'Second deliverable',
      deliverable3: 'Third deliverable',
      deliverable4: 'Fourth deliverable',
      timeline: 'Project timeline',
      desiredOutcome: 'Desired outcome',
      meetingLink: 'Meeting link',
      senderName: 'Your name',
      senderTitle: 'Your title',
    },
    isShared: true,
  },

  // Re-engagement
  {
    name: 'Re-engagement Email',
    type: 'RE_ENGAGEMENT',
    subject: 'We miss you, {{firstName}}!',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 20px;">👋</div>
              <h1 style="margin: 0 0 20px; color: #333333; font-size: 28px; font-weight: 600;">We Miss You!</h1>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                It's been a while since we last connected, and I wanted to reach out to see how things are going at {{companyName}}.
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: left;">
                <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">
                  Since we last spoke, we've:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li>{{update1}}</li>
                  <li>{{update2}}</li>
                  <li>{{update3}}</li>
                </ul>
              </div>
              
              <p style="margin: 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                I'd love to reconnect and hear about what you've been working on. Are you still interested in {{previousInterest}}?
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{reconnectLink}}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Let's Reconnect</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #555555; font-size: 14px; line-height: 1.6;">
                If now isn't the right time, no worries! Just let me know and I'll check back in a few months.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Company name',
      update1: 'First update',
      update2: 'Second update',
      update3: 'Third update',
      previousInterest: 'What they were interested in',
      reconnectLink: 'Reconnection link',
    },
    isShared: true,
  },

  // Stage Change: Qualified
  {
    name: 'Qualified Lead Follow-up',
    type: 'STAGE_CHANGE',
    subject: 'Next steps for {{companyName}}',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Great news! Based on our conversation, I believe we're a great fit to help {{companyName}} achieve {{goal}}.
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                I'd like to schedule a deeper discovery call to understand your specific needs and show you how we can deliver results.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{calendarLink}}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Schedule Discovery Call</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Looking forward to our next conversation!<br><br>
                {{senderName}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables: {
      firstName: 'Contact first name',
      companyName: 'Company name',
      goal: 'Their goal',
      calendarLink: 'Calendar link',
      senderName: 'Your name',
    },
    isShared: true,
  },

  // Engagement Response: Email Opened
  {
    name: 'Email Opened Follow-up',
    type: 'ENGAGEMENT_RESPONSE',
    subject: 'Following up on my last email',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                I noticed you opened my recent email about {{topic}}. I wanted to follow up and see if you had any questions or if there's anything I can clarify.
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                {{additionalContext}}
              </p>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Would you be open to a quick call this week to discuss further?
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{meetingLink}}" style="display: inline-block; padding: 14px 32px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Book a Time</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                {{senderName}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables: {
      firstName: 'Contact first name',
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

  // Get the first admin user to assign templates to
  const adminUser = await prisma.crmUser.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.error('❌ No admin user found. Please create an admin user first.');
    process.exit(1);
  }

  console.log(`📧 Creating ${templates.length} email templates...`);

  for (const template of templates) {
    const created = await prisma.emailTemplate.create({
      data: {
        ...template,
        userId: adminUser.id,
      },
    });
    console.log(`✅ Created: ${created.name}`);
  }

  console.log('\n✨ Email templates seeded successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - ${templates.length} templates created`);
  console.log(`   - All templates are shared (available to all users)`);
  console.log(`   - Templates include variable placeholders for personalization`);
  console.log(`   - Templates are categorized by type for automation`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e);
    process.exit(1);
  });
