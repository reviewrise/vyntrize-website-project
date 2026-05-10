// GET /api/crm/leads - Search and list leads

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: any = {};

    // Search by contact name or company name
    if (search) {
      where.OR = [
        {
          contact: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          company: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          title: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    // Fetch leads
    const leads = await prisma.lead.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format response
    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      contactName: `${lead.contact.firstName} ${lead.contact.lastName}`,
      company: lead.company?.name || null,
      stage: lead.stage,
      title: lead.title,
      email: lead.contact.email,
    }));

    return NextResponse.json({
      leads: formattedLeads,
      count: formattedLeads.length,
    });
  } catch (error) {
    console.error('[API] Failed to search leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
