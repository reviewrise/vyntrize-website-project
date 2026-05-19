'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';
import { initializeAgentSystem } from '@/lib/agents/init';

async function requireAdmin() {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'ADMIN') {
        throw new Error('Access denied. Admin role required.');
    }
    return session;
}

export interface ImportSummary {
    contactsCreated: number;
    leadsCreated: number;
    skipped: number;
    total: number;
}

export async function runImport(): Promise<{ success: boolean; summary?: ImportSummary; error?: string }> {
    const session = await requireAdmin();

    try {
        // Get already-imported submission IDs
        const importedRecords = await prisma.importRecord.findMany({
            select: { contactSubmissionId: true },
        });
        const importedIds = new Set(importedRecords.map(r => r.contactSubmissionId));

        // Fetch all unimported submissions directly via Prisma (same DB)
        const submissions = await prisma.contactSubmission.findMany({
            orderBy: { createdAt: 'asc' },
        });

        const unimported = submissions.filter(s => !importedIds.has(s.id));

        let contactsCreated = 0;
        let leadsCreated = 0;
        let skipped = 0;

        // Ensure agents are initialized before emitting events
        await initializeAgentSystem();

        // Collect created lead IDs to emit events after all transactions complete
        const createdLeadIds: string[] = [];

        for (const submission of unimported) {
            try {
                let createdLeadId: string | null = null;

                await prisma.$transaction(async tx => {
                    // Find or create contact
                    const existingContact = await tx.contact.findUnique({
                        where: { email: submission.email.toLowerCase() },
                    });

                    let contactId: string;
                    let contactCreated = false;

                    if (!existingContact) {
                        // Create company if provided
                        let companyId: string | null = null;
                        if (submission.company) {
                            const existingCompany = await tx.company.findFirst({
                                where: { name: { equals: submission.company, mode: 'insensitive' } },
                            });
                            companyId = existingCompany
                                ? existingCompany.id
                                : (await tx.company.create({ data: { name: submission.company } })).id;
                        }

                        const newContact = await tx.contact.create({
                            data: {
                                firstName: submission.firstName,
                                lastName: submission.lastName,
                                email: submission.email.toLowerCase(),
                                companyId,
                            },
                        });
                        contactId = newContact.id;
                        contactCreated = true;
                        contactsCreated++;
                    } else {
                        contactId = existingContact.id;
                        skipped++;
                    }

                    // Create lead in NEW stage
                    const leadTitle = submission.intent
                        ? submission.intent.charAt(0).toUpperCase() + submission.intent.slice(1).replace(/-/g, ' ')
                        : 'Website Enquiry';

                    const lead = await tx.lead.create({
                        data: { title: leadTitle, stage: 'NEW', contactId },
                    });
                    leadsCreated++;

                    // Capture lead ID outside transaction scope for event emission
                    createdLeadId = lead.id;

                    // Log original message as a NOTE activity
                    await tx.activity.create({
                        data: {
                            type: 'NOTE',
                            body: submission.message,
                            leadId: lead.id,
                            userId: session.userId,
                        },
                    });

                    // Mark as imported
                    await tx.importRecord.create({
                        data: {
                            contactSubmissionId: submission.id,
                            contactId,
                            leadId: lead.id,
                            skipped: !contactCreated,
                        },
                    });
                });

                // Emit LEAD_CREATED event AFTER the transaction commits
                // so agents can safely query the lead from the database
                if (createdLeadId) {
                    createdLeadIds.push(createdLeadId);
                }
            } catch (err) {
                console.error(`Failed to import submission ${submission.id}:`, err);
                skipped++;
            }
        }

        // Fire LEAD_CREATED events for all successfully imported leads
        // Done after the loop so the import summary is accurate even if agent processing fails
        for (const leadId of createdLeadIds) {
            try {
                await eventBus.emitCRMEvent(CRMEvent.LEAD_CREATED, {
                    leadId,
                    userId: session.userId,
                    metadata: { source: 'import' },
                });
                
                // Also emit STAGE_CHANGED so that automations triggering on "stage_entered: NEW" (like Drip Sequences) catch imported leads
                await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, {
                    leadId,
                    userId: session.userId,
                    previousValue: null,
                    newValue: 'NEW',
                    metadata: { source: 'import' },
                });
                
                console.log(`[Import] Emitted LEAD_CREATED and STAGE_CHANGED for lead ${leadId}`);
            } catch (err) {
                // Agent errors must not fail the import
                console.error(`[Import] Failed to emit LEAD_CREATED for lead ${leadId}:`, err);
            }
        }

        return {
            success: true,
            summary: { contactsCreated, leadsCreated, skipped, total: unimported.length },
        };
    } catch (err) {
        console.error('Import failed:', err);
        return { success: false, error: 'Import failed. Please try again.' };
    }
}
