// API endpoints for individual email template operations (update, delete)

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';

// GET - Fetch a single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId: templateIdStr } = await params;
    const templateId = parseInt(templateIdStr, 10);

    const template = await vyntrizeDb.emailTemplate.findUnique({
      where: { id: templateId },
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

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check access: own template or shared template
    if (template.userId !== session.userId && !template.isShared) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

// PATCH - Update an email template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId: templateIdStr } = await params;
    const templateId = parseInt(templateIdStr, 10);
    const body = await request.json();
    const { name, subject, body: templateBody, variables, isShared } = body;

    // Check if template exists
    const existingTemplate = await vyntrizeDb.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only owner or admin can edit
    if (existingTemplate.userId !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only edit your own templates' },
        { status: 403 }
      );
    }

    // Only admins can change shared status
    if (isShared !== undefined && isShared !== existingTemplate.isShared && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can change shared status' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      if (name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (subject !== undefined) {
      if (subject.trim().length === 0) {
        return NextResponse.json(
          { error: 'Subject cannot be empty' },
          { status: 400 }
        );
      }
      updateData.subject = subject.trim();
    }

    if (templateBody !== undefined) {
      if (templateBody.trim().length === 0) {
        return NextResponse.json(
          { error: 'Body cannot be empty' },
          { status: 400 }
        );
      }
      updateData.body = templateBody.trim();
    }

    if (variables !== undefined) {
      updateData.variables = variables;
    }

    if (isShared !== undefined) {
      updateData.isShared = isShared;
    }

    const updatedTemplate = await vyntrizeDb.emailTemplate.update({
      where: { id: templateId },
      data: updateData,
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

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId: templateIdStr } = await params;
    const templateId = parseInt(templateIdStr, 10);

    // Check if template exists
    const existingTemplate = await vyntrizeDb.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only owner or admin can delete
    if (existingTemplate.userId !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only delete your own templates' },
        { status: 403 }
      );
    }

    await vyntrizeDb.emailTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    );
  }
}
