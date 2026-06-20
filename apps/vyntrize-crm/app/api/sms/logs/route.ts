/**
 * GET /api/sms/logs
 *
 * Returns paginated SMS log records plus aggregate stats.
 * Query params: page (default 1), limit (default 25), status, search
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession }               from '@/lib/session';
import { prisma }                   from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
    const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '25', 10));
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const skip   = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { toPhone:      { contains: search } },
        { toName:       { contains: search } },
        { content:      { contains: search } },
      ];
    }

    const [logs, total, statsRaw] = await Promise.all([
      prisma.smsLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          contact: { select: { firstName: true, lastName: true, email: true } },
          lead:    { select: { id: true } },
        },
      }),
      prisma.smsLog.count({ where }),
      // Aggregate counts by status
      prisma.smsLog.groupBy({
        by:     ['status'],
        _count: { _all: true },
      }),
    ]);

    const stats = { total: 0, sent: 0, failed: 0, skipped: 0, queued: 0 };
    for (const row of statsRaw) {
      const count = row._count._all;
      stats.total += count;
      switch (row.status) {
        case 'SENT':    stats.sent    += count; break;
        case 'FAILED':  stats.failed  += count; break;
        case 'SKIPPED': stats.skipped += count; break;
        case 'QUEUED':  stats.queued  += count; break;
      }
    }

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    });
  } catch (err) {
    console.error('[GET /api/sms/logs]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
