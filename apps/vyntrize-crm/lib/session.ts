import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
    userId: string;
    email: string;
    displayName: string;
    role: 'ADMIN' | 'MEMBER';
    isLoggedIn: boolean;
}

// Lazy getter so SESSION_SECRET is read at call time, not at module load time
export function getSessionOptions(): SessionOptions {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET environment variable is not set.');
    return {
        password: secret,
        cookieName: 'crm_session',
        cookieOptions: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
        },
    };
}

export async function getSession(): Promise<IronSession<SessionData>> {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, getSessionOptions());
    return session;
}
