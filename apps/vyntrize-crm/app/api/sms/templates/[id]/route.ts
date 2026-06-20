import { NextRequest, NextResponse } from 'next/server';
import { getSession }               from '@/lib/session';
import { prisma }                   from '@/lib/prisma';

/**
 * PATCH /api/sms/templates/[id]
 * Updates an existing SMS template.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, body: templateBody, type, variables, isShared } = body;

    const template = await prisma.smsTemplate.update({
      where: { id },
      data: {
        ...(name          !== undefined && { name:      name.trim() }),
        ...(templateBody  !== undefined && { body:      templateBody.trim() }),
        ...(type          !== undefined && { type }),
        ...(variables     !== undefined && { variables }),
        ...(isShared      !== undefined && { isShared }),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('[PATCH /api/sms/templates/[id]]', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

/**
 * DELETE /api/sms/templates/[id]
 * Deletes an SMS template.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await prisma.smsTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/sms/templates/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
