import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import crypto from 'crypto';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';

const WEBHOOK_SECRET = process.env.VYNTRISE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signatureHeader = req.headers.get('x-vyntrise-signature');

        // 1. Signature Verification (if secret is configured)
        if (WEBHOOK_SECRET) {
            if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
                return NextResponse.json({ error: 'Missing or invalid signature header' }, { status: 401 });
            }

            const signature = signatureHeader.slice(7); // Remove 'sha256='
            const expectedSignature = crypto
                .createHmac('sha256', WEBHOOK_SECRET)
                .update(rawBody)
                .digest('hex');

            // Prevent timing attacks
            const isValid = crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );

            if (!isValid) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        // 2. Parse payload
        const payload = JSON.parse(rawBody);

        if (payload.event !== 'booking.created') {
            return NextResponse.json({ message: 'Ignored event type' }, { status: 200 });
        }

        const appointment = payload.appointment;
        if (!appointment) {
            return NextResponse.json({ error: 'Missing appointment data' }, { status: 400 });
        }

        const qa = appointment.bookingFlowQa || [];
        
        // Helper to extract QA answers
        const getAnswer = (stepId: string) => qa.find((q: any) => q.stepId === stepId)?.answer;

        // Extract fields
        const organizationName = getAnswer('organization_name') || payload.organization?.name;
        
        // Use customerEmail from appointment if it looks like an email, otherwise fallback to QA
        let contactEmail = appointment.customerEmail;
        if (!contactEmail || !contactEmail.includes('@')) {
            contactEmail = getAnswer('contact_email');
        }

        if (!contactEmail) {
            return NextResponse.json({ error: 'Could not determine contact email' }, { status: 400 });
        }

        const serviceSelection = getAnswer('service_selection') || appointment.serviceDescription || 'General Consultation';
        const preferredDateTime = getAnswer('preferred_date_time');
        const additionalNotes = getAnswer('additional_notes');

        // Customer Name
        const customerName = appointment.customerName || 'Unknown Contact';
        const nameParts = customerName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        // 3. Database Operations
        const createdLead = await vyntrizeDb.$transaction(async (tx) => {
            // A. Upsert Company (if organization name exists)
            let companyId: string | undefined;
            if (organizationName && organizationName.toLowerCase() !== 'n/a') {
                // Try to find an existing company by name, or create
                const existingCompany = await tx.company.findFirst({
                    where: { name: { equals: organizationName, mode: 'insensitive' } }
                });

                if (existingCompany) {
                    companyId = existingCompany.id;
                } else {
                    const newCompany = await tx.company.create({
                        data: { name: organizationName }
                    });
                    companyId = newCompany.id;
                }
            }

            // B. Upsert Contact
            const contact = await tx.contact.upsert({
                where: { email: contactEmail },
                update: {
                    firstName,
                    lastName: lastName || undefined,
                    companyId: companyId || undefined,
                },
                create: {
                    email: contactEmail,
                    firstName,
                    lastName,
                    companyId: companyId || undefined,
                }
            });

            // C. Create Lead (Deal)
            const leadTitle = `${serviceSelection} - ${contact.firstName} ${contact.lastName}`.trim();
            const lead = await tx.lead.create({
                data: {
                    title: leadTitle,
                    stage: 'NEW',
                    contactId: contact.id,
                    companyId: companyId,
                    source: appointment.source || 'chatbot_embed',
                }
            });

            // D. Create Lead Note with appointment details
            const noteBody = `
**New Booking Received**
- **Service**: ${serviceSelection}
- **Scheduled Time**: ${appointment.startTime} to ${appointment.endTime}
- **Preferred Time (User Input)**: ${preferredDateTime || 'N/A'}
- **Additional Notes**: ${additionalNotes || 'None'}
            `.trim();

            await tx.leadNote.create({
                data: {
                    leadId: lead.id,
                    userId: null, // System-generated note — no human author
                    note: noteBody,
                }
            });
            
            return lead;
        });

        // 4. Emit event for workflow automation
        await eventBus.emitCRMEvent(CRMEvent.LEAD_CREATED, {
            leadId: createdLead.id,
            userId: 'SYSTEM',
            metadata: { 
                source: appointment.source || 'chatbot_embed',
                appointmentStartTime: appointment.startTime,
                appointmentEndTime: appointment.endTime,
                appointmentDescription: serviceSelection,
            }
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Webhooks] Vyntrise Booking Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
