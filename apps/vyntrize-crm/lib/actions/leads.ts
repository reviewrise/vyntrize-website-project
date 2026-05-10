'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function requireAuth() {
    const session = await getSession();
    if (!session.isLoggedIn) throw new Error('Not authenticated.');
    return session;
}

const OPEN_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'];

export async function createLead(formData: FormData) {
    const session = await requireAuth();

    const title = (formData.get('title') as string)?.trim();
    const contactId = formData.get('contactId') as string;
    const companyId = (formData.get('companyId') as string)?.trim() || null;
    const assigneeId = (formData.get('assigneeId') as string)?.trim() || null;

    if (!title || !contactId) {
        return { error: 'Title and contact are required.' };
    }

    const lead = await prisma.lead.create({
        data: {
            title,
            contactId,
            companyId,
            assigneeId,
            stage: 'NEW',
        },
    });

    await prisma.auditLog.create({
        data: {
            entityType: 'Lead',
            entityId: lead.id,
            field: 'stage',
            prevValue: null,
            newValue: 'NEW',
            userId: session.userId,
        },
    });

    // Emit lead created event for agents
    try {
        const { eventBus, CRMEvent } = await import('@/lib/agents/event-bus');
        const { agentRegistry } = await import('@/lib/agents/registry');
        
        // Ensure agents are registered (in case this runs before instrumentation)
        if (!agentRegistry.isInitialized()) {
            console.log('[createLead] Agent registry not initialized, initializing now...');
            await agentRegistry.registerAllAgents();
        }
        
        await eventBus.emitCRMEvent(CRMEvent.LEAD_CREATED, {
            leadId: lead.id,
            userId: session.userId,
            metadata: {
                title,
                contactId,
                companyId,
                assigneeId,
            },
        });
        console.log(`[createLead] Emitted LEAD_CREATED event for lead ${lead.id}`);
    } catch (error) {
        console.error('[createLead] Failed to emit lead created event:', error);
        // Don't fail the lead creation if event emission fails
    }

    revalidatePath('/pipeline');
    return { success: true, leadId: lead.id };
}

export async function updateLeadStage(formData: FormData) {
    const session = await requireAuth();

    const id = formData.get('id') as string;
    const stage = formData.get('stage') as string;
    const closingNote = (formData.get('closingNote') as string)?.trim() || null;

    if (!id || !stage) return { error: 'Lead ID and stage are required.' };

    const validStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];
    if (!validStages.includes(stage)) return { error: 'Invalid stage.' };

    if ((stage === 'WON' || stage === 'LOST') && !closingNote) {
        return { requiresClosingNote: true, error: 'A closing note is required when moving to WON or LOST.' };
    }

    const current = await prisma.lead.findUnique({ where: { id } });
    if (!current) return { error: 'Lead not found.' };

    const prevStage = current.stage;

    await prisma.$transaction([
        prisma.lead.update({
            where: { id },
            data: {
                stage: stage as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST',
                ...(closingNote ? { closingNote } : {}),
            },
        }),
        prisma.auditLog.create({
            data: {
                entityType: 'Lead',
                entityId: id,
                field: 'stage',
                prevValue: prevStage,
                newValue: stage,
                userId: session.userId,
            },
        }),
        prisma.activity.create({
            data: {
                type: 'NOTE',
                body: `Stage changed from ${prevStage} to ${stage}${closingNote ? `. Note: ${closingNote}` : ''}`,
                leadId: id,
                userId: session.userId,
            },
        }),
    ]);

    // Emit stage change event for agents
    try {
        const { eventBus, CRMEvent } = await import('@/lib/agents/event-bus');
        const { agentRegistry } = await import('@/lib/agents/registry');
        
        // Ensure agents are registered (in case this runs before instrumentation)
        if (!agentRegistry.isInitialized()) {
            console.log('[updateLeadStage] Agent registry not initialized, initializing now...');
            await agentRegistry.registerAllAgents();
        }
        
        await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, {
            leadId: id,
            userId: session.userId,
            previousValue: prevStage,
            newValue: stage,
            metadata: {
                closingNote,
            },
        });
        console.log(`[updateLeadStage] Emitted STAGE_CHANGED event for lead ${id}: ${prevStage} → ${stage}`);
    } catch (error) {
        console.error('[updateLeadStage] Failed to emit stage change event:', error);
        // Don't fail the stage update if event emission fails
    }

    revalidatePath('/pipeline');
    revalidatePath(`/leads/${id}`);
    return { success: true };
}

export async function updateLeadDeal(formData: FormData) {
    const session = await requireAuth();

    const id = formData.get('id') as string;
    const dealValueStr = formData.get('dealValue') as string;
    const closeDateStr = formData.get('closeDate') as string;
    const assigneeId = (formData.get('assigneeId') as string)?.trim() || null;

    if (!id) return { error: 'Lead ID is required.' };

    const updates: Record<string, unknown> = {};

    if (dealValueStr !== '' && dealValueStr !== null && dealValueStr !== undefined) {
        const dealValue = parseFloat(dealValueStr);
        if (isNaN(dealValue) || dealValue < 0) {
            return { error: 'Deal value must be a non-negative number.' };
        }
        updates.dealValue = dealValue;
    } else {
        updates.dealValue = null;
    }

    if (closeDateStr) {
        const closeDate = new Date(closeDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (closeDate < today) {
            return { error: 'Close date must be today or a future date.' };
        }
        updates.closeDate = closeDate;
    } else {
        updates.closeDate = null;
    }

    if (assigneeId !== undefined) {
        updates.assigneeId = assigneeId;
    }

    await prisma.lead.update({ where: { id }, data: updates });

    revalidatePath('/pipeline');
    revalidatePath(`/leads/${id}`);
    return { success: true };
}
