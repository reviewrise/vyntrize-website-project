// GET /api/agents/roi — Compare AI-generated vs manual email performance

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    // ── 1. Email performance: AI-sent (drip / agent) vs manual ─────────────
    // Note: EmailLog has no repliedAt — use clickedAt as a strong-intent proxy
    const [agentEmails, manualEmails] = await Promise.all([
      prisma.emailLog.findMany({
        where: { sentAt: { gte: since }, userId: 'system' },
        select: { id: true, status: true, openedAt: true, clickedAt: true },
      }),
      prisma.emailLog.findMany({
        where: { sentAt: { gte: since }, NOT: { userId: 'system' } },
        select: { id: true, status: true, openedAt: true, clickedAt: true },
      }),
    ]);

    const calcRates = (emails: typeof agentEmails) => {
      const sent = emails.filter((e) => e.status === 'SENT').length || 1;
      const opened = emails.filter((e) => e.openedAt).length;
      const clicked = emails.filter((e) => e.clickedAt).length;
      return {
        total: emails.length,
        sent,
        openRate: Math.round((opened / sent) * 1000) / 10,
        clickRate: Math.round((clicked / sent) * 1000) / 10,
      };
    };

    // ── 2. Agent action approval stats ─────────────────────────────────────
    const [totalActions, approvedActions, rejectedActions, feedbackCountRaw] =
      await Promise.all([
        prisma.agentAction.count({ where: { createdAt: { gte: since } } }),
        prisma.agentAction.count({
          where: { createdAt: { gte: since }, status: { in: ['APPROVED', 'EXECUTED'] } },
        }),
        prisma.agentAction.count({
          where: { createdAt: { gte: since }, status: 'REJECTED' },
        }),
        // Use raw SQL for correctedText — camelCase matches Prisma's actual column names
        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) AS count
          FROM agent_actions
          WHERE "createdAt" >= ${since}
            AND "correctedText" IS NOT NULL
        `,
      ]);

    const feedbackCount = Number(feedbackCountRaw[0]?.count ?? 0);


    // ── 3. Agent actions by type (for bar chart) ─────────────────────────────
    const actionsByAgent = await prisma.agentAction.groupBy({
      by: ['agentType'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },   
    });

    // ── 4. Daily action trend (last N days) ───────────────────────────────
    const allActions = await prisma.agentAction.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const trendMap: Record<string, { date: string; total: number; approved: number }> = {};
    allActions.forEach((a) => {
      const day = a.createdAt.toISOString().slice(0, 10);
      if (!trendMap[day]) trendMap[day] = { date: day, total: 0, approved: 0 };
      trendMap[day].total++;
      if (a.status === 'APPROVED' || a.status === 'EXECUTED') trendMap[day].approved++;
    });
    const trend = Object.values(trendMap);

    // ── 5. Lead score distribution ────────────────────────────────────────
    const leadScoreBuckets = await prisma.$queryRaw<
      { bucket: string; count: bigint }[]
    >`
      SELECT
        CASE
          WHEN score >= 80 THEN 'Hot (80-100)'
          WHEN score >= 60 THEN 'Qualified (60-79)'
          WHEN score >= 40 THEN 'Warm (40-59)'
          WHEN score >= 20 THEN 'Cold (20-39)'
          ELSE 'Unqualified (0-19)'
        END AS bucket,
        COUNT(*) AS count
      FROM crm_leads
      WHERE score IS NOT NULL
      GROUP BY bucket
      ORDER BY MIN(score) DESC
    `;

    return NextResponse.json({
      dateRange: { days, since: since.toISOString() },
      emailPerformance: {
        agent: calcRates(agentEmails),
        manual: calcRates(manualEmails),
      },
      approvalStats: {
        total: totalActions,
        approved: approvedActions,
        rejected: rejectedActions,
        pending: totalActions - approvedActions - rejectedActions,
        approvalRate:
          totalActions > 0
            ? Math.round((approvedActions / totalActions) * 1000) / 10
            : 0,
        feedbackCount,
      },
      actionsByAgent: actionsByAgent.map((a) => ({
        agentType: a.agentType,
        count: a._count._all,
      })),
      trend,
      leadScoreDistribution: leadScoreBuckets.map((b) => ({
        bucket: b.bucket,
        count: Number(b.count),
      })),
    });
  } catch (error) {
    console.error('[API] ROI metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
