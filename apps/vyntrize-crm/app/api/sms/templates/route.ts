import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sms/templates
 * Returns all SMS templates.
 */
export async function GET() {
  try {
    const templates = await prisma.smsTemplate.findMany({
      select: { id: true, name: true, body: true, type: true, variables: true, isShared: true, createdAt: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('[GET /api/sms/templates]', error);
    return NextResponse.json({ error: 'Failed to fetch SMS templates' }, { status: 500 });
  }
}

/**
 * POST /api/sms/templates
 * Creates a new SMS template.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, body: templateBody, type = 'GENERAL', variables, isShared = true } = body;

    if (!name?.trim() || !templateBody?.trim()) {
      return NextResponse.json({ error: 'Name and body are required.' }, { status: 400 });
    }

    const template = await prisma.smsTemplate.create({
      data: {
        name:      name.trim(),
        body:      templateBody.trim(),
        type,
        variables: variables ?? [],
        isShared,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('[POST /api/sms/templates]', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
