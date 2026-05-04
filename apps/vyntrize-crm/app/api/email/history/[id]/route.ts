/**
 * Email History API
 * GET /api/email/history/[id]?type=contact|lead
 * Returns email history for a contact or lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'contact'; // 'contact' or 'lead'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query based on type
    const where = type === 'lead' ? { leadId: id } : { contactId: id };

    // Get emails
    const [emails, total] = await Promise.all([
      vyntrizeDb.emailLog.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          events: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      vyntrizeDb.emailLog.count({ where }),
    ]);

    // Calculate stats
    const stats = {
      total,
      sent: emails.filter(e => e.status === 'SENT' || e.status === 'DELIVERED').length,
      opened: emails.filter(e => e.openedAt !== null).length,
      clicked: emails.filter(e => e.clickedAt !== null).length,
      bounced: emails.filter(e => e.status === 'BOUNCED').length,
      failed: emails.filter(e => e.status === 'FAILED').length,
    };

    return NextResponse.json({
      emails: emails.map(email => ({
        id: email.id,
        subject: email.subject,
        toEmail: email.toEmail,
        toName: email.toName,
        status: email.status,
        sentAt: email.sentAt,
        openedAt: email.openedAt,
        clickedAt: email.clickedAt,
        openCount: email.openCount,
        clickCount: email.clickCount,
        template: email.template,
        sentBy: email.user,
        events: email.events,
        trackingId: email.trackingId,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('[Email History API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
