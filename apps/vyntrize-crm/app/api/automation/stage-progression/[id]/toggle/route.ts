/**
 * Automation API — Stage Progression Rule Toggle
 * PATCH /api/automation/stage-progression/[id]/toggle  — flip isActive
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await vyntrizeDb.stageProgressionRule.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const rule = await vyntrizeDb.stageProgressionRule.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('[Automation API] Error toggling stage progression rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
