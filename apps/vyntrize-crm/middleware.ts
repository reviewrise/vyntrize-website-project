import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, getSessionOptions } from './lib/session';

const ADMIN_ONLY_PATHS = ['/admin', '/import'];
const PUBLIC_PATHS = [
    '/login',
    '/api/health',
    '/api/email/track',
    '/book',
    '/api/book',
    '/api/availability',
    '/api/webhooks',
    '/pay'
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // iron-session in middleware requires a Response object to read/write cookies
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, getSessionOptions());

    if (!session.isLoggedIn || !session.userId) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Admin-only route guard
    if (ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
        if (session.role !== 'ADMIN') {
            return new NextResponse(
                JSON.stringify({ error: 'Access denied. Admin role required.' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Forward user info in headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-role', session.role);
    requestHeaders.set('x-user-email', session.email);

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    // Exclude Next.js internals, public static assets, and the health endpoint
    matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|icons/|fonts/|api/health).*)'],
};
