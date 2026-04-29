'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function requireAuth() {
    const session = await getSession();
    if (!session.isLoggedIn) throw new Error('Not authenticated.');
    return session;
}

export async function createActivity(formData: FormData) {
    const session = await requireAuth();

    const type = formData.get('type') as 'NOTE' | 'CALL' | 'EMAIL';
    const body = (formData.get('body') as string)?.trim();
    const leadId = (formData.get('leadId') as string)?.trim() || null;
    const contactId = (formData.get('contactId') as string)?.trim() || null;
    const durationStr = formData.get('duration') as string;
    const direction = (formData.get('direction') as 'INBOUND' | 'OUTBOUND') || null;

    if (!type || !['NOTE', 'CALL', 'EMAIL'].includes(type)) {
        return { error: 'Invalid activity type.' };
    }
    if (!body) return { error: 'Body text is required.' };
    if (!leadId && !contactId) return { error: 'Either a lead or contact must be specified.' };
    if (leadId && contactId) return { error: 'Specify either a lead or contact, not both.' };

    const duration =
        (type === 'CALL' || type === 'EMAIL') && durationStr
            ? parseInt(durationStr, 10)
            : null;

    await prisma.activity.create({
        data: {
            type,
            body,
            leadId,
            contactId,
            userId: session.userId,
            duration: duration && !isNaN(duration) ? duration : null,
            direction: (type === 'CALL' || type === 'EMAIL') ? direction : null,
        },
    });

    if (leadId) revalidatePath(`/leads/${leadId}`);
    if (contactId) revalidatePath(`/contacts/${contactId}`);
    return { success: true };
}

export async function editActivity(formData: FormData) {
    const session = await requireAuth();

    const id = formData.get('id') as string;
    const body = (formData.get('body') as string)?.trim();

    if (!id || !body) return { error: 'Activity ID and body are required.' };

    const current = await prisma.activity.findUnique({ where: { id } });
    if (!current) return { error: 'Activity not found.' };

    await prisma.activity.update({
        where: { id },
        data: {
            body,
            originalBody: current.originalBody ?? current.body,
            isEdited: true,
        },
    });

    if (current.leadId) revalidatePath(`/leads/${current.leadId}`);
    if (current.contactId) revalidatePath(`/contacts/${current.contactId}`);
    return { success: true };
}

export async function deleteActivity(formData: FormData) {
    const session = await requireAuth();

    const id = formData.get('id') as string;
    const confirmed = formData.get('confirmed') === 'true';

    if (!id) return { error: 'Activity ID is required.' };
    if (!confirmed) return { error: 'Confirmation required.' };

    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) return { error: 'Activity not found.' };

    await prisma.activity.delete({ where: { id } });

    if (activity.leadId) revalidatePath(`/leads/${activity.leadId}`);
    if (activity.contactId) revalidatePath(`/contacts/${activity.contactId}`);
    return { success: true };
}
