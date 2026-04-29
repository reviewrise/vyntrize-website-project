import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Bot user-agent patterns to filter out
const BOT_PATTERNS = /bot|crawler|spider|scraper|headless|phantom|selenium|puppeteer|lighthouse|prerender/i;

function parseDevice(ua: string): string {
    if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
        return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
    }
    return 'desktop';
}

function parseSource(referrer: string | null): string | null {
    if (!referrer) return null;
    try {
        const url = new URL(referrer);
        return url.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const ua = req.headers.get('user-agent') ?? '';

        // Silently ignore bots
        if (BOT_PATTERNS.test(ua)) {
            return NextResponse.json({ ok: true });
        }

        const body = await req.json();
        const { path, referrer, sessionId } = body;

        if (!path || !sessionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await prisma.pageView.create({
            data: {
                path: path.slice(0, 500),
                referrer: referrer?.slice(0, 1000) ?? null,
                source: parseSource(referrer ?? null),
                userAgent: ua.slice(0, 500),
                sessionId,
                device: parseDevice(ua),
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        // Never fail silently — tracking should never break the site
        console.error('Track error:', error);
        return NextResponse.json({ ok: true });
    }
}
