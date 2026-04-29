import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const leads = await prisma.contactSubmission.findMany({
        where: status && status !== 'all' ? { status: status.toUpperCase() as never } : undefined,
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leads);
}

export async function DELETE() {
    await prisma.contactSubmission.deleteMany();
    return NextResponse.json({ success: true });
}
