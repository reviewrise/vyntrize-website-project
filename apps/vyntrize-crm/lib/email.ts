import { format } from 'date-fns';
import { emailService } from '@/lib/email/email-service';
import crypto from 'crypto';

const APP_URL = process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com';
const BRAND_COLOR = '#0f172a'; // slate-900
const ACCENT_COLOR = '#3b82f6'; // blue-500

function generateEmailTemplate(title: string, preheader: string, content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; line-height: 1.6;">
        <span style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: ${BRAND_COLOR}; padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">VyntRise</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f1f5f9; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">
                      &copy; ${new Date().getFullYear()} VyntRise. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendBookingConfirmation({
  toEmail,
  contactName,
  expertName,
  expertEmail,
  startTime,
  endTime,
  meetLink,
  cancelToken,
  rescheduleToken
}: {
  toEmail: string;
  contactName: string;
  expertName: string;
  expertEmail: string;
  startTime: Date;
  endTime: Date;
  meetLink?: string | null;
  cancelToken: string;
  rescheduleToken: string;
}) {
  const dateStr = format(startTime, "EEEE, MMMM d, yyyy");
  const timeStr = `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`;

  const meetSection = meetLink 
    ? `
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);">
        <div style="margin-bottom: 16px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
            <path d="M15 10L19.5528 7.72361C20.2177 7.39116 21 7.87465 21 8.61803V15.382C21 16.1253 20.2177 16.6088 19.5528 16.2764L15 14V10Z" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="3" y="6" width="12" height="12" rx="2" stroke="#3b82f6" stroke-width="2"/>
          </svg>
        </div>
        <h3 style="color: #1e3a8a; margin-top: 0; margin-bottom: 16px; font-size: 18px;">Join your Virtual Meeting</h3>
        <a href="${meetLink}" style="display: inline-block; background-color: ${ACCENT_COLOR}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3); transition: background-color 0.2s;">Join Google Meet</a>
        <p style="margin: 16px 0 0; font-size: 13px; color: #60a5fa;">Link: <a href="${meetLink}" style="color: #3b82f6; text-decoration: underline;">${meetLink}</a></p>
      </div>
    `
    : `
      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; color: #475569; font-size: 15px; font-weight: 500;">Meeting details (location or link) will be provided directly by ${expertName} shortly.</p>
      </div>
    `;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background-color: #e0e7ff; color: #4338ca; padding: 10px 20px; border-radius: 50px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">
        Booking Confirmed
      </div>
    </div>
    
    <p style="color: #334155; margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Hi ${contactName},</p>
    
    <p style="color: #334155; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
      Thank you for reaching out to VyntRise. Your consultation with <strong>${expertName}</strong> has been successfully confirmed. We are thrilled to connect with you and explore how we can help your business scale efficiently.
    </p>
    
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 32px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">Meeting Details</h3>
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="70" style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px;">Date:</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 500;">${dateStr}</td>
        </tr>
        <tr>
          <td width="70" style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px;">Time:</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 500;">${timeStr}</td>
        </tr>
        <tr>
          <td width="70" style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px;">Host:</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 500;">${expertName}</td>
        </tr>
      </table>
    </div>

    ${meetSection}

    <div style="margin: 40px 0;">
      <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 18px;">What to Expect</h3>
      <ul style="color: #475569; font-size: 15px; line-height: 1.6; padding-left: 20px; margin: 0;">
        <li style="margin-bottom: 10px;"><strong>Discovery:</strong> We'll start by understanding your current operations, goals, and bottlenecks.</li>
        <li style="margin-bottom: 10px;"><strong>Strategy:</strong> We'll discuss potential AI, data, and automation solutions tailored to your needs.</li>
        <li style="margin-bottom: 0;"><strong>Action Plan:</strong> You'll leave with clear, actionable insights on how to modernize your workflow.</li>
      </ul>
    </div>

    <p style="color: #334155; margin: 0 0 32px; font-size: 15px; line-height: 1.6; background-color: #f8fafc; padding: 16px; border-left: 4px solid #94a3b8; border-radius: 0 8px 8px 0;">
      <em>Tip: To make the most of our time together, please gather any current metrics, software tools you use, or specific challenges you want to discuss.</em>
    </p>

    <div style="margin-top: 48px; background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px dashed #cbd5e1;">
      <p style="margin: 0 0 16px; color: #475569; font-size: 15px; font-weight: 600;">Need to adjust the schedule?</p>
      <div style="margin: 0;">
        <a href="${APP_URL}/book/reschedule?token=${rescheduleToken}" style="display: inline-block; padding: 10px 20px; background-color: #ffffff; color: ${ACCENT_COLOR}; border: 1px solid #cbd5e1; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Reschedule Meeting</a> 
      </div>
      <p style="margin: 16px 0 0 0; color: #94a3b8; font-size: 12px;">We kindly ask for 24 hours notice if you need to reschedule.</p>
    </div>
  `;

  const trackingId = crypto.randomUUID();
  const subject = `Meeting Confirmed: ${expertName} and ${contactName}`;
  const htmlBody = generateEmailTemplate('Meeting Confirmed', `Your meeting with ${expertName} is confirmed for ${dateStr}.`, content);

  await emailService.sendEmail({
    role: 'sales',
    to: toEmail,
    toName: contactName,
    bcc: expertEmail,
    subject,
    html: htmlBody,
    trackingId,
  });
}

export async function sendBookingCancellation({
  toEmail,
  contactName,
  expertName,
  expertEmail,
  startTime,
}: {
  toEmail: string;
  contactName: string;
  expertName: string;
  expertEmail: string;
  startTime: Date;
}) {
  const dateStr = format(startTime, "EEEE, MMMM d, yyyy");

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background-color: #fee2e2; color: #b91c1c; padding: 10px 20px; border-radius: 50px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">
        Meeting Cancelled
      </div>
    </div>
    
    <p style="color: #334155; margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Hi ${contactName},</p>
    
    <p style="color: #334155; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
      This email is to confirm that your consultation with <strong>${expertName}</strong> scheduled for <strong>${dateStr}</strong> has been cancelled.
    </p>

    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
      <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">When you're ready to reconnect, you can always easily book a new time that works for you.</p>
      <a href="${APP_URL}/book" style="display: inline-block; background-color: #ffffff; color: ${ACCENT_COLOR}; border: 1px solid #cbd5e1; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: background-color 0.2s;">Book a New Time</a>
    </div>

    <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.6;">
      If you cancelled by mistake or need immediate assistance, please reply directly to this email.
    </p>
  `;

  const trackingId = crypto.randomUUID();
  const subject = `Meeting Cancelled: ${expertName} and ${contactName}`;
  const htmlBody = generateEmailTemplate('Meeting Cancelled', `Your meeting with ${expertName} has been cancelled.`, content);

  await emailService.sendEmail({
    role: 'sales',
    to: toEmail,
    toName: contactName,
    bcc: expertEmail,
    subject,
    html: htmlBody,
    trackingId,
  });
}
