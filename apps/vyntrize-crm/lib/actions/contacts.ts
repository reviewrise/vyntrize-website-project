'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function requireAuth() {
    const session = await getSession();
    if (!session.isLoggedIn) throw new Error('Not authenticated.');
    return session;
}

export async function createContact(formData: FormData) {
    const session = await requireAuth();

    const firstName = (formData.get('firstName') as string)?.trim();
    const lastName = (formData.get('lastName') as string)?.trim();
    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const phone = (formData.get('phone') as string)?.trim() || null;
    const jobTitle = (formData.get('jobTitle') as string)?.trim() || null;
    const companyId = (formData.get('companyId') as string)?.trim() || null;
    const forceCreate = formData.get('forceCreate') === 'true';

    if (!firstName || !lastName || !email) {
        return { error: 'First name, last name, and email are required.' };
    }

    // Check for duplicate email (including soft-deleted)
    const existing = await prisma.contact.findUnique({
        where: { email },
    });

    if (existing && !forceCreate) {
        return {
            duplicate: true,
            error: `A contact with email ${email} already exists. Confirm to save anyway.`,
        };
    }

    const contact = await prisma.contact.create({
        data: { firstName, lastName, email, phone, jobTitle, companyId },
    });

    // Audit log for creation
    await prisma.auditLog.create({
        data: {
            entityType: 'Contact',
            entityId: contact.id,
            field: 'created',
            prevValue: null,
            newValue: `${firstName} ${lastName} <${email}>`,
            userId: session.userId,
        },
    });

    revalidatePath('/contacts');
    return { success: true, contactId: contact.id };
}

export async function updateContact(formData: FormData) {
    const session = await requireAuth();

    const id = formData.get('id') as string;
    if (!id) return { error: 'Contact ID is required.' };

    const current = await prisma.contact.findUnique({ where: { id } });
    if (!current) return { error: 'Contact not found.' };

    const updates: Record<string, string | null> = {
        firstName: (formData.get('firstName') as string)?.trim() || current.firstName,
        lastName: (formData.get('lastName') as string)?.trim() || current.lastName,
        email: (formData.get('email') as string)?.toLowerCase().trim() || current.email,
        phone: (formData.get('phone') as string)?.trim() || null,
        jobTitle: (formData.get('jobTitle') as string)?.trim() || null,
        companyId: (formData.get('companyId') as string)?.trim() || null,
    };

    // Diff and write audit logs
    const auditEntries: Array<{
        entityType: string;
        entityId: string;
        field: string;
        prevValue: string | null;
        newValue: string | null;
        userId: string;
    }> = [];

    const fields = ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'companyId'] as const;
    for (const field of fields) {
        const prev = (current as Record<string, unknown>)[field] as string | null;
        const next = updates[field];
        if (prev !== next) {
            auditEntries.push({
                entityType: 'Contact',
                entityId: id,
                field,
                prevValue: prev ?? null,
                newValue: next ?? null,
                userId: session.userId,
            });
        }
    }

    await prisma.$transaction([
        prisma.contact.update({
            where: { id },
            data: {
                firstName: updates.firstName!,
                lastName: updates.lastName!,
                email: updates.email!,
                phone: updates.phone,
                jobTitle: updates.jobTitle,
                companyId: updates.companyId,
            },
        }),
        ...auditEntries.map((entry) => prisma.auditLog.create({ data: entry })),
    ]);

    revalidatePath('/contacts');
    revalidatePath(`/contacts/${id}`);
    return { success: true };
}

export async function deleteContact(formData: FormData) {
    const session = await requireAuth();

    const id = formData.get('id') as string;
    const confirmed = formData.get('confirmed') === 'true';

    if (!id) return { error: 'Contact ID is required.' };
    if (!confirmed) return { error: 'Confirmation required.' };

    await prisma.contact.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
        data: {
            entityType: 'Contact',
            entityId: id,
            field: 'deletedAt',
            prevValue: null,
            newValue: new Date().toISOString(),
            userId: session.userId,
        },
    });

    revalidatePath('/contacts');
    return { success: true };
}
