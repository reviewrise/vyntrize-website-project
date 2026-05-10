// GET /api/agents/actions - List agent actions with filtering and pagination

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { AgentType, ActionStatus } from '@platform/vyntrize-db';

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
    const leadId = searchParams.get('leadId');
    const agentType = searchParams.get('agentType') as AgentType | null;
    const status = searchParams.get('status') as ActionStatus | null;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (agentType) where.agentType = agentType;
    if (status) where.status = status;
    
    // Add search filter for lead name or company
    if (search) {
      where.lead = {
        OR: [
          { contactName: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Fetch actions with pagination
    const [actions, total] = await Promise.all([
      prisma.agentAction.findMany({
        where,
        include: {
          lead: {
            include: {
              contact: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.agentAction.count({ where }),
    ]);

    return NextResponse.json({
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch agent actions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
