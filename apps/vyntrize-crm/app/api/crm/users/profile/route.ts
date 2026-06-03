import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/crm/users/profile — fetch the current user's profile
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.crmUser.findUnique({
      where: { id: session.userId as string },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        bookingSlug: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH /api/crm/users/profile — update the current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, bookingSlug, email } = body;

    // Validate email uniqueness
    if (email !== undefined && email !== '') {
      const existingEmail = await prisma.crmUser.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id: session.userId as string },
        },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'That email is already in use by another account.' },
          { status: 409 }
        );
      }
    }

    // Validate bookingSlug format (lowercase letters, numbers, hyphens only)
    if (bookingSlug !== undefined && bookingSlug !== null && bookingSlug !== '') {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(bookingSlug)) {
        return NextResponse.json(
          { error: 'Booking slug can only contain lowercase letters, numbers, and hyphens.' },
          { status: 400 }
        );
      }

      // Check uniqueness (excluding the current user)
      const existing = await prisma.crmUser.findFirst({
        where: {
          bookingSlug,
          NOT: { id: session.userId as string },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'That booking slug is already taken. Please choose another.' },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.crmUser.update({
      where: { id: session.userId as string },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(email !== undefined && email !== '' && { email: email.toLowerCase().trim() }),
        ...(bookingSlug !== undefined && { bookingSlug: bookingSlug || null }),
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        bookingSlug: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
