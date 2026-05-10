// GET /api/agents/metrics - Get agent performance metrics

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { AgentType } from '@platform/vyntrize-db';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const agentType = searchParams.get('agentType') as AgentType | null;
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build filter
    const where: any = {
      createdAt: {
        gte: startDate,
      },
    };
    if (agentType) where.agentType = agentType;

    // Fetch action counts by status
    const actionsByStatus = await prisma.agentAction.groupBy({
      by: ['status', 'agentType'],
      where,
      _count: true,
    });

    // Fetch action counts by type
    const actionsByType = await prisma.agentAction.groupBy({
      by: ['actionType', 'agentType'],
      where,
      _count: true,
    });

    // Calculate approval rate
    const totalActions = await prisma.agentAction.count({ where });
    const approvedActions = await prisma.agentAction.count({
      where: {
        ...where,
        status: {
          in: ['APPROVED', 'EXECUTED'],
        },
      },
    });
    const approvalRate = totalActions > 0 ? (approvedActions / totalActions) * 100 : 0;

    // Calculate average execution time (for executed actions)
    const executedActions = await prisma.agentAction.findMany({
      where: {
        ...where,
        status: 'EXECUTED',
        executedAt: { not: null },
      },
      select: {
        createdAt: true,
        executedAt: true,
      },
    });

    const executionTimes = executedActions
      .filter(a => a.executedAt)
      .map(a => a.executedAt!.getTime() - a.createdAt.getTime());
    
    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;

    // Fetch agent-specific metrics from AgentMetric table
    const agentMetrics = await prisma.agentMetric.findMany({
      where: {
        calculatedAt: {
          gte: startDate,
        },
        ...(agentType && { agentType }),
      },
      orderBy: {
        calculatedAt: 'desc',
      },
      take: 100,
    });

    // Group metrics by agent type
    const metricsByAgent: Record<string, any[]> = {};
    agentMetrics.forEach(metric => {
      if (!metricsByAgent[metric.agentType]) {
        metricsByAgent[metric.agentType] = [];
      }
      metricsByAgent[metric.agentType].push({
        metricName: metric.metricName,
        metricValue: metric.metricValue,
        calculatedAt: metric.calculatedAt,
        metadata: metric.metadata,
      });
    });

    return NextResponse.json({
      summary: {
        totalActions,
        approvedActions,
        approvalRate: Math.round(approvalRate * 100) / 100,
        avgExecutionTimeMs: Math.round(avgExecutionTime),
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days,
        },
      },
      actionsByStatus,
      actionsByType,
      metricsByAgent,
    });
  } catch (error) {
    console.error('[API] Failed to fetch agent metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
