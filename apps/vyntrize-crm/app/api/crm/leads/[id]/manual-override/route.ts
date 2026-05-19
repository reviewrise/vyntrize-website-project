/**
 * PATCH /api/crm/leads/[id]/manual-override
 * Sets or clears the manualOverride flag on a lead.
 * Requires any authenticated session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bodySchema = z.object({
  manualOverride: z.boolean(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { manualOverride: parsed.data.manualOverride },
      select: { id: true, manualOverride: true },
    });

    return NextResponse.json({ lead: updated });
  } catch (error) {
    console.error('[API] Failed to update manual override:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
