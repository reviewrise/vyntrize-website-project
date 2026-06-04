import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeadActivityService } from '@/../../apps/vyntrize-crm/lib/services/lead-activity-service';
import { AttributionService } from '@/../../apps/vyntrize-crm/lib/attribution/attribution-service';
import { extractUTMParams } from '@/lib/analytics/utils';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { firstName, lastName, email, phone, company, intent, message, visitorId, sessionId } = body;

        if (!firstName || !lastName || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Extract UTM parameters from referrer
        const referrer = req.headers.get('referer');
        const utmParams = extractUTMParams(referrer || undefined);
        
        // Hash IP for privacy
        const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || null;
        const ipAddressHash = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16) : null;

        // Create contact submission
        const submission = await prisma.contactSubmission.create({
            data: {
                firstName,
                lastName,
                email,
                company: company || null,
                intent: intent || 'other',
                message,
                source: referrer || null,
                ipAddress: ipAddressHash,
                userAgent: req.headers.get('user-agent') || null,
            },
        });

        // Create or find contact in CRM
        let contact = await prisma.contact.findUnique({
            where: { email },
        });

        if (!contact) {
            contact = await prisma.contact.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    ...(phone ? { phone } : {}),
                },
            });
        } else if (phone && !contact.phone) {
            contact = await prisma.contact.update({
                where: { email },
                data: { phone },
            });
        }

        // Create lead
        const leadTitle = company 
            ? `${company} - ${intent || 'Website Enquiry'}`
            : `${firstName} ${lastName} - ${intent || 'Website Enquiry'}`;

        const lead = await prisma.lead.create({
            data: {
                title: leadTitle,
                stage: 'NEW',
                contactId: contact.id,
                visitorId: visitorId || null,
                sessionId: sessionId || null,
                source: utmParams?.source || 'website',
                medium: utmParams?.medium || 'organic',
                campaign: utmParams?.campaign || null,
                utmContent: utmParams?.content || null,
                utmTerm: utmParams?.term || null,
            },
        });

        // Mark the submission as imported so it doesn't get duplicated if a user clicks the Import button in the CRM
        await prisma.importRecord.create({
            data: {
                contactSubmissionId: submission.id,
                contactId: contact.id,
                leadId: lead.id,
                skipped: false,
            }
        });

        // Associate visitor activities with lead (if visitor ID provided)
        if (visitorId && sessionId) {
            try {
                await LeadActivityService.associateVisitorWithLead(
                    visitorId,
                    sessionId,
                    lead.id
                );
            } catch (error) {
                console.error('Error associating visitor with lead:', error);
                // Don't fail the request if activity association fails
            }
        }

        // Create initial lead activity for form submission
        try {
            await LeadActivityService.createActivity({
                leadId: lead.id,
                activityType: 'form_submit',
                activityName: 'contact-form',
                activityData: {
                    intent,
                    hasCompany: !!company,
                    hasPhone: !!phone,
                    messageLength: message.length,
                },
                sessionId: sessionId || undefined,
                ipAddressHash: ipAddressHash || undefined,
                userAgent: req.headers.get('user-agent') || undefined,
            });
        } catch (error) {
            console.error('Error creating lead activity:', error);
        }

        // Track attribution (first touch and last touch)
        try {
            if (sessionId) {
                // Track from session (includes UTM params)
                await AttributionService.trackFromSession(lead.id, sessionId);
            } else {
                // Track from UTM params directly
                await AttributionService.recordFirstTouch(lead.id, {
                    source: utmParams?.source,
                    medium: utmParams?.medium,
                    campaign: utmParams?.campaign,
                    content: utmParams?.content,
                    term: utmParams?.term,
                });
            }
        } catch (error) {
            console.error('Error tracking attribution:', error);
            // Don't fail the request if attribution tracking fails
        }

        return NextResponse.json({ 
            success: true, 
            id: submission.id,
            leadId: lead.id,
        }, { status: 201 });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
