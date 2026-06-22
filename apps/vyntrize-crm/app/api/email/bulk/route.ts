/**
 * Bulk Email API
 * POST /api/email/bulk
 * Send emails to multiple recipients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { emailService } from '@/lib/email/email-service';
import { TemplateRenderer } from '@/lib/email/template-renderer';
import { TrackingService } from '@/lib/email/tracking-service';

interface BulkEmailRequest {
  campaignName: string;
  subject: string;
  body?: string;
  templateId?: number;
  recipients: Array<{
    email: string;
    name?: string;
    contactId?: string;
    leadId?: string;
    variables?: Record<string, any>;
  }>;
  scheduledAt?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data = await request.json() as BulkEmailRequest;

    // Validate required fields
    if (!data.campaignName || !data.subject || (!data.body && !data.templateId)) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignName, subject, and body or templateId' },
        { status: 400 }
      );
    }

    if (!data.recipients || data.recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients provided' },
        { status: 400 }
      );
    }

    // Get template if templateId provided
    let emailBody = data.body || '';
    let emailSubject = data.subject;
    let template = null;

    if (data.templateId) {
      template = await vyntrizeDb.emailTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      emailBody = template.body;
      emailSubject = template.subject;
    }

    // Filter out unsubscribed emails
    const unsubscribedEmails = await vyntrizeDb.emailUnsubscribe.findMany({
      where: {
        email: {
          in: data.recipients.map(r => r.email),
        },
      },
      select: { email: true },
    });

    const unsubscribedSet = new Set(unsubscribedEmails.map(u => u.email));
    const validRecipients = data.recipients.filter(r => !unsubscribedSet.has(r.email));

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { error: 'All recipients have unsubscribed' },
        { status: 400 }
      );
    }

    // Create campaign
    const campaign = await vyntrizeDb.emailCampaign.create({
      data: {
        name: data.campaignName,
        subject: emailSubject,
        templateId: data.templateId,
        status: data.scheduledAt ? 'SCHEDULED' : 'SENDING',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        targetType: 'manual',
        totalRecipients: validRecipients.length,
        userId: session.userId,
      },
    });

    // If scheduled, queue for later
    if (data.scheduledAt) {
      // Queue emails for scheduled sending
      for (const recipient of validRecipients) {
        const trackingId = TrackingService.generateTrackingId();
        const variables = recipient.variables || {};
        
        const renderedBody = TemplateRenderer.render(emailBody, variables);
        const renderedSubject = TemplateRenderer.render(emailSubject, variables);
        const trackedBody = TemplateRenderer.renderWithTracking(renderedBody, {}, trackingId);
        const finalBody = TemplateRenderer.inlineCSS(trackedBody);

        await vyntrizeDb.emailQueue.create({
          data: {
            emailData: {
              to: recipient.email,
              toName: recipient.name,
              subject: renderedSubject,
              html: finalBody,
              trackingId,
              contactId: recipient.contactId,
              leadId: recipient.leadId,
              campaignId: campaign.id,
              templateId: data.templateId,
              userId: session.userId,
            },
            status: 'PENDING',
            scheduledFor: new Date(data.scheduledAt),
          },
        });
      }

      return NextResponse.json({
        success: true,
        campaignId: campaign.id,
        status: 'scheduled',
        scheduledAt: data.scheduledAt,
        totalRecipients: validRecipients.length,
        skipped: data.recipients.length - validRecipients.length,
      });
    }

    // Send immediately
    let sentCount = 0;
    let failedCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const recipient of validRecipients) {
      try {
        const trackingId = TrackingService.generateTrackingId();
        const variables = recipient.variables || {};
        
        // Render template with recipient-specific variables
        const renderedBody = TemplateRenderer.render(emailBody, variables);
        const renderedSubject = TemplateRenderer.render(emailSubject, variables);
        const trackedBody = TemplateRenderer.renderWithTracking(renderedBody, {}, trackingId);
        const finalBody = TemplateRenderer.inlineCSS(trackedBody);

        // Send email (emailService automatically handles logging to the database)
        const sendResult = await emailService.sendEmail({
          role: 'sales',
          to: recipient.email,
          toName: recipient.name,
          subject: renderedSubject,
          html: finalBody,
          trackingId,
          contactId: recipient.contactId,
          leadId: recipient.leadId,
          campaignId: campaign.id,
          templateId: data.templateId,
          userId: session.userId,
        });

        if (sendResult.success) {

          sentCount++;
        } else {
          failedCount++;
          errors.push({
            email: recipient.email,
            error: sendResult.error || 'Unknown error',
          });
        }
      } catch (error) {
        failedCount++;
        errors.push({
          email: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update campaign stats
    await vyntrizeDb.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: failedCount === validRecipients.length ? 'FAILED' : 'SENT',
        sentAt: new Date(),
        sentCount,
        failedCount,
      },
    });

    console.log('[Bulk Email API] Campaign sent:', {
      campaignId: campaign.id,
      sent: sentCount,
      failed: failedCount,
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      status: 'sent',
      totalRecipients: validRecipients.length,
      sent: sentCount,
      failed: failedCount,
      skipped: data.recipients.length - validRecipients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Bulk Email API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
