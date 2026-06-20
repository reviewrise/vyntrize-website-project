// GET /api/email/logs
// Returns paginated email logs for the whole CRM with summary stats.

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';

export async function GET(request: NextRequest) {
  try {
    // Pagination params – defaults
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const skip = (page - 1) * limit;

    // Fetch email logs and total count in parallel
    const [emails, total] = await Promise.all([
      vyntrizeDb.emailLog.findMany({
        include: {
          template: { select: { id: true, name: true } },
          user: { select: { id: true, displayName: true, email: true } },
          events: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      vyntrizeDb.emailLog.count(),
    ]);

    // Compute aggregated stats across all emails (not just the page)
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
        errorMessage: (email as any).errorMessage ?? null,
        template: email.template,
        sentBy: email.user,
        trackingId: email.trackingId,
        events: email.events,
        htmlBody: email.htmlBody,
        body: email.body,
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
    console.error('[Email Logs API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
