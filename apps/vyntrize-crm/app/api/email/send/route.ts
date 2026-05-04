/**
 * Send Individual Email API
 * POST /api/email/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { emailService } from '@/lib/email/email-service';
import { TemplateRenderer } from '@/lib/email/template-renderer';
import { TrackingService } from '@/lib/email/tracking-service';

interface SendEmailRequest {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  templateId?: number;
  templateVariables?: Record<string, any>;
  contactId?: string;
  leadId?: string;
  replyTo?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data = await request.json() as SendEmailRequest;

    // Validate required fields
    if (!data.to || !data.subject || (!data.body && !data.templateId)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and body or templateId' },
        { status: 400 }
      );
    }

    // Check if email is unsubscribed
    const unsubscribed = await vyntrizeDb.emailUnsubscribe.findUnique({
      where: { email: data.to },
    });

    if (unsubscribed) {
      return NextResponse.json(
        { error: 'Email address has unsubscribed' },
        { status: 400 }
      );
    }

    // Get template if templateId provided
    let emailBody = data.body;
    let emailSubject = data.subject;

    if (data.templateId) {
      const template = await vyntrizeDb.emailTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      // Render template with variables
      const variables = data.templateVariables || {};
      emailBody = TemplateRenderer.render(template.body, variables);
      emailSubject = TemplateRenderer.render(template.subject, variables);
    }

    // Generate tracking ID
    const trackingId = TrackingService.generateTrackingId();

    // Add tracking to email body
    const trackedBody = TemplateRenderer.renderWithTracking(
      emailBody,
      {},
      trackingId
    );

    // Inline CSS for better email client compatibility
    const finalBody = TemplateRenderer.inlineCSS(trackedBody);

    // Send email
    const sendResult = await emailService.sendEmail({
      to: data.to,
      toName: data.toName,
      subject: emailSubject,
      html: finalBody,
      replyTo: data.replyTo,
      trackingId,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Create email log
    const emailLog = await vyntrizeDb.emailLog.create({
      data: {
        subject: emailSubject,
        body: emailBody,
        htmlBody: finalBody,
        fromEmail: process.env.EMAIL_FROM_ADDRESS || 'noreply@vyntrize.com',
        fromName: process.env.EMAIL_FROM_NAME || 'Vyntrize CRM',
        toEmail: data.to,
        toName: data.toName,
        replyTo: data.replyTo,
        trackingId,
        status: 'SENT',
        sentAt: new Date(),
        contactId: data.contactId,
        leadId: data.leadId,
        templateId: data.templateId,
        userId: session.userId,
      },
    });

    // Create sent event
    await vyntrizeDb.emailEvent.create({
      data: {
        emailLogId: emailLog.id,
        eventType: 'SENT',
        eventData: {
          messageId: sendResult.messageId,
        },
      },
    });

    console.log('[Email API] Email sent successfully:', {
      to: data.to,
      subject: emailSubject,
      trackingId,
    });

    return NextResponse.json({
      success: true,
      emailId: emailLog.id,
      trackingId,
      messageId: sendResult.messageId,
    });
  } catch (error) {
    console.error('[Email API] Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
