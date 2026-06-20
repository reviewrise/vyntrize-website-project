import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/email/templates
 * Returns all email templates for use in automation rule builder.
 */
export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      select: { id: true, name: true, subject: true, body: true, type: true, variables: true, isShared: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('[GET /api/email/templates]', error);
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
  }
}
