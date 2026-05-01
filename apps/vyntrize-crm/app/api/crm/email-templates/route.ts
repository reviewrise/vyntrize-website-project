// API endpoints for email templates (CRUD)

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';

// GET - Fetch all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeShared = searchParams.get('includeShared') !== 'false';

    // Build where clause
    const where: any = {};

    if (includeShared) {
      // Get user's own templates + shared templates
      where.OR = [
        { userId: session.userId },
        { isShared: true },
      ];
    } else {
      // Only user's own templates
      where.userId = session.userId;
    }

    const templates = await vyntrizeDb.emailTemplate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isShared: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// POST - Create a new email template
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, subject, body: templateBody, variables, isShared = false } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json(
        { error: 'Name, subject, and body are required' },
        { status: 400 }
      );
    }

    // Only admins can create shared templates
    if (isShared && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create shared templates' },
        { status: 403 }
      );
    }

    const template = await vyntrizeDb.emailTemplate.create({
      data: {
        userId: session.userId,
        name: name.trim(),
        subject: subject.trim(),
        body: templateBody.trim(),
        variables: variables || null,
        isShared,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}
