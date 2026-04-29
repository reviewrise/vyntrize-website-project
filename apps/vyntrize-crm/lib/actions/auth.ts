'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export type LoginState = { error?: string } | null;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Invalid credentials.' };
    }

    try {
        const user = await prisma.crmUser.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user || !user.isActive) {
            return { error: 'Invalid credentials.' };
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return { error: 'Invalid credentials.' };
        }

        const session = await getSession();
        session.userId = user.id;
        session.email = user.email;
        session.displayName = user.displayName;
        session.role = user.role as 'ADMIN' | 'MEMBER';
        session.isLoggedIn = true;
        await session.save();
    } catch (err) {
        console.error('[login] Authentication error:', err);
        return { error: 'An error occurred. Please try again.' };
    }

    redirect('/dashboard');
}

export async function logout() {
    const session = await getSession();
    session.destroy();
    redirect('/login');
}
