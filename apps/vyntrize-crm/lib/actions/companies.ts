'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function requireAuth() {
    const session = await getSession();
    if (!session.isLoggedIn) throw new Error('Not authenticated.');
    return session;
}

export async function createCompany(formData: FormData) {
    const session = await requireAuth();

    const name = (formData.get('name') as string)?.trim();
    const website = (formData.get('website') as string)?.trim() || null;
    const industry = (formData.get('industry') as string)?.trim() || null;
    const notes = (formData.get('notes') as string)?.trim() || null;

    if (!name) return { error: 'Company name is required.' };

    const company = await prisma.company.create({
        data: { name, website, industry, notes },
    });

    revalidatePath('/companies');
    return { success: true, companyId: company.id };
}

export async function updateCompany(formData: FormData) {
    await requireAuth();

    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const website = (formData.get('website') as string)?.trim() || null;
    const industry = (formData.get('industry') as string)?.trim() || null;
    const notes = (formData.get('notes') as string)?.trim() || null;

    if (!id || !name) return { error: 'ID and name are required.' };

    await prisma.company.update({
        where: { id },
        data: { name, website, industry, notes },
    });

    revalidatePath('/companies');
    revalidatePath(`/companies/${id}`);
    return { success: true };
}

export async function deleteCompany(formData: FormData) {
    await requireAuth();

    const id = formData.get('id') as string;
    const confirmed = formData.get('confirmed') === 'true';

    if (!id) return { error: 'Company ID is required.' };
    if (!confirmed) return { error: 'Confirmation required.' };

    // Nullify companyId on associated contacts
    await prisma.contact.updateMany({
        where: { companyId: id },
        data: { companyId: null },
    });

    // Nullify companyId on associated leads
    await prisma.lead.updateMany({
        where: { companyId: id },
        data: { companyId: null },
    });

    await prisma.company.delete({ where: { id } });

    revalidatePath('/companies');
    return { success: true };
}
