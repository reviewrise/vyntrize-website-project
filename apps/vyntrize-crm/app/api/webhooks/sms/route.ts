import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { emitSmsReplied } from '@/lib/agents/event-emitter';
import { ActionType, AutonomyLevel, ActionStatus } from '@/lib/agents/base-agent';
import { AgentType } from '@/lib/agents/base-agent';

export async function POST(req: NextRequest) {
    try {
        let from = '';
        let to = '';
        let body = '';

        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const json = await req.json();
            from = json.from || json.From;
            to = json.to || json.To;
            body = json.content || json.Body || json.body;
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            from = formData.get('From')?.toString() || '';
            to = formData.get('To')?.toString() || '';
            body = formData.get('Body')?.toString() || '';
        } else {
            return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
        }

        if (!from || !body) {
            return NextResponse.json({ error: 'Missing From or Body' }, { status: 400 });
        }

        // Standardize phone format if needed (e.g. assume E.164)
        if (!from.startsWith('+')) {
            from = '+' + from.replace(/\D/g, '');
        }

        // 1. Find Contact by phone
        const contact = await vyntrizeDb.contact.findFirst({
            where: { phone: from }
        });

        if (!contact) {
            console.warn(`[SMS Webhook] Received SMS from unknown number: ${from}`);
            return NextResponse.json({ success: true, warning: 'Contact not found' }, { status: 200 });
        }

        // 2. Find active Lead for this contact
        const lead = await vyntrizeDb.lead.findFirst({
            where: { 
                contactId: contact.id,
                stage: { notIn: ['WON', 'LOST'] } // Find active lead
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!lead) {
            console.warn(`[SMS Webhook] No active lead found for contact: ${contact.id}`);
            return NextResponse.json({ success: true, warning: 'No active lead found' }, { status: 200 });
        }

        // 3. Log the inbound SMS to Activity or SmsLog
        await vyntrizeDb.smsLog.create({
            data: {
                toPhone: to || 'vyntrise_number',
                content: body,
                status: 'SENT', // Effectively 'RECEIVED' but using existing enum or just log
                contactId: contact.id,
                leadId: lead.id,
            }
        });

        // Add note to lead timeline
        await vyntrizeDb.leadNote.create({
            data: {
                leadId: lead.id,
                note: `**Inbound SMS Received:**\n\n${body}`,
            }
        });

        // 4. Emit SMS_REPLIED event
        await emitSmsReplied(lead.id, {
            contactId: contact.id,
            message: body,
            fromPhone: from
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Webhooks] SMS Webhook Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
