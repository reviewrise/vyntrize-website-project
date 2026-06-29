import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';

export async function POST(req: NextRequest) {
    try {
        let from = '';
        let to = '';
        let text = '';
        let subject = '';

        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const json = await req.json();
            from = json.from;
            to = json.to;
            text = json.text || json.body;
            subject = json.subject;
        } else if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            from = formData.get('from')?.toString() || '';
            to = formData.get('to')?.toString() || '';
            text = formData.get('text')?.toString() || '';
            subject = formData.get('subject')?.toString() || '';
        } else {
            return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
        }

        if (!from) {
            return NextResponse.json({ error: 'Missing From' }, { status: 400 });
        }

        // Parse from email (could be "Name <email@domain.com>")
        const emailMatch = from.match(/<([^>]+)>/);
        const emailAddress = emailMatch ? emailMatch[1].toLowerCase() : from.toLowerCase();

        // 1. Find Contact by email
        const contact = await vyntrizeDb.contact.findFirst({
            where: { email: emailAddress }
        });

        if (!contact) {
            console.warn(`[Email Webhook] Received email from unknown address: ${emailAddress}`);
            return NextResponse.json({ success: true, warning: 'Contact not found' }, { status: 200 });
        }

        // 2. Find active Lead for this contact
        const lead = await vyntrizeDb.lead.findFirst({
            where: { 
                contactId: contact.id,
                stage: { notIn: ['WON', 'LOST'] }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!lead) {
            console.warn(`[Email Webhook] No active lead found for contact: ${contact.id}`);
            return NextResponse.json({ success: true, warning: 'No active lead found' }, { status: 200 });
        }

        // 3. Log the inbound Email
        await vyntrizeDb.leadNote.create({
            data: {
                leadId: lead.id,
                note: `**Inbound Email Received:**\n*Subject: ${subject}*\n\n${text}`,
            }
        });

        // 4. Emit EMAIL_REPLIED event
        await eventBus.emitCRMEvent(CRMEvent.EMAIL_REPLIED, {
            leadId: lead.id,
            metadata: {
                contactId: contact.id,
                subject: subject,
                text: text,
                fromEmail: emailAddress
            }
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Webhooks] Email Webhook Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
