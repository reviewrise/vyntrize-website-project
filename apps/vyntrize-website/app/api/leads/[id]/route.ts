import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.contactSubmission.update({
        where: { id },
        data: {
            ...(body.status && { status: body.status }),
            ...(body.notes !== undefined && { notes: body.notes }),
            ...(body.priority && { priority: body.priority }),
            ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
        },
    });

    return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await prisma.contactSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
