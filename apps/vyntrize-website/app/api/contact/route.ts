import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { firstName, lastName, email, company, intent, message } = body;

        if (!firstName || !lastName || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const submission = await prisma.contactSubmission.create({
            data: {
                firstName,
                lastName,
                email,
                company: company || null,
                intent: intent || 'other',
                message,
                source: req.headers.get('referer') || null,
                ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || null,
                userAgent: req.headers.get('user-agent') || null,
            },
        });

        return NextResponse.json({ success: true, id: submission.id }, { status: 201 });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
