import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';

export async function POST(request: NextRequest) {
  try {
    let fromStr = '';
    let textBody = '';
    let subject = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      // Parse Resend webhook format
      if (body.type === 'email.received' && body.data) {
        fromStr = body.data.from || '';
        textBody = body.data.text || '';
        subject = body.data.subject || '';
      } else {
        // Fallback for generic JSON
        fromStr = body.from || '';
        textBody = body.text || '';
        subject = body.subject || '';
      }
    } else {
      // SendGrid / Mailgun (multipart/form-data)
      const formData = await request.formData();
      fromStr = (formData.get('from') as string) || '';
      textBody = (formData.get('text') as string) || '';
      subject = (formData.get('subject') as string) || '';
    }

    // Extract email from format "Name <email@domain.com>"
    const emailMatch = fromStr.match(/<([^>]+)>/);
    const fromEmail = emailMatch ? emailMatch[1].toLowerCase() : fromStr.toLowerCase().trim();

    if (!fromEmail) {
      return NextResponse.json({ error: 'No from address provided' }, { status: 400 });
    }

    // 1. Find contact and their most recent active lead
    const contact = await prisma.contact.findUnique({
      where: { email: fromEmail },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!contact || contact.leads.length === 0) {
      // Ignored: Reply is not from a known contact/lead in the CRM
      return NextResponse.json({ success: true, message: 'Ignored (no matching contact/lead found)' });
    }

    const lead = contact.leads[0];

    // 2. Mark the most recent email as replied
    const latestTracking = await prisma.emailTracking.findFirst({
      where: { leadId: lead.id },
      orderBy: { sentAt: 'desc' },
    });

    if (latestTracking && !latestTracking.repliedAt) {
      await prisma.emailTracking.update({
        where: { id: latestTracking.id },
        data: { repliedAt: new Date() },
      });
    }

    // Since drip campaigns use EmailLog, we also need to create a log of this inbound reply
    await prisma.activity.create({
      data: {
        type: 'EMAIL',
        body: `**Customer Replied:** ${subject}\n\n${textBody}`,
        leadId: lead.id,
        userId: 'system',
      },
    });

    // 3. Emit EMAIL_REPLIED event so agents can react
    await eventBus.emitCRMEvent(CRMEvent.EMAIL_REPLIED, {
      leadId: lead.id,
      userId: 'system',
      metadata: {
        subject,
        replyText: textBody,
        source: 'inbound_webhook',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to process inbound email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
