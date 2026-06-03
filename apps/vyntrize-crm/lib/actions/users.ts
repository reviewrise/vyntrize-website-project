'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function requireAdmin() {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'ADMIN') {
        throw new Error('Access denied. Admin role required.');
    }
    return session;
}

function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function createUser(formData: FormData) {
    await requireAdmin();

    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const displayName = formData.get('displayName') as string;
    const role = formData.get('role') as 'ADMIN' | 'MEMBER';

    if (!email || !displayName || !role) {
        return { error: 'Email, display name, and role are required.' };
    }

    if (!['ADMIN', 'MEMBER'].includes(role)) {
        return { error: 'Invalid role.' };
    }

    const existing = await prisma.crmUser.findUnique({ where: { email } });
    if (existing) {
        return { error: 'A user with this email already exists.' };
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.crmUser.create({
        data: { email, displayName, passwordHash, role },
    });

    revalidatePath('/admin/users');
    return { success: true, userId: user.id, tempPassword };
}

export async function updateUserRole(formData: FormData) {
    await requireAdmin();

    const userId = formData.get('userId') as string;
    const role = formData.get('role') as 'ADMIN' | 'MEMBER';

    if (!userId || !['ADMIN', 'MEMBER'].includes(role)) {
        return { error: 'Invalid input.' };
    }

    await prisma.crmUser.update({
        where: { id: userId },
        data: { role },
    });

    revalidatePath('/admin/users');
    return { success: true };
}

export async function deactivateUser(formData: FormData) {
    const session = await requireAdmin();

    const userId = formData.get('userId') as string;
    if (!userId) {
        return { error: 'User ID is required.' };
    }

    if (userId === session.userId) {
        return { error: 'You cannot deactivate your own account.' };
    }

    await prisma.crmUser.update({
        where: { id: userId },
        data: { isActive: false },
    });

    revalidatePath('/admin/users');
    return { success: true };
}

export async function reactivateUser(formData: FormData) {
    await requireAdmin();

    const userId = formData.get('userId') as string;
    if (!userId) return { error: 'User ID is required.' };

    await prisma.crmUser.update({
        where: { id: userId },
        data: { isActive: true },
    });

    revalidatePath('/admin/users');
    return { success: true };
}

export async function updateUser(data: {
    userId: string;
    displayName?: string;
    email?: string;
    role?: 'ADMIN' | 'MEMBER';
    bookingSlug?: string | null;
}) {
    await requireAdmin();

    const { userId, displayName, email, role, bookingSlug } = data;
    if (!userId) return { error: 'User ID is required.' };

    if (email) {
        const existing = await prisma.crmUser.findFirst({
            where: { email: email.toLowerCase().trim(), NOT: { id: userId } },
        });
        if (existing) return { error: 'That email is already taken.' };
    }

    if (bookingSlug) {
        const existing = await prisma.crmUser.findFirst({
            where: { bookingSlug, NOT: { id: userId } },
        });
        if (existing) return { error: 'That booking slug is already taken.' };
    }

    const updated = await prisma.crmUser.update({
        where: { id: userId },
        data: {
            ...(displayName && { displayName }),
            ...(email && { email: email.toLowerCase().trim() }),
            ...(role && { role }),
            ...(bookingSlug !== undefined && { bookingSlug: bookingSlug || null }),
        },
    });

    revalidatePath('/admin/users');
    return { success: true, user: updated };
}
