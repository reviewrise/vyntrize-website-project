import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

async function requireAdmin() {
  const session = await getSession();
  if (!session || !session.isLoggedIn || session.role !== 'ADMIN') {
    return null;
  }
  return session;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 16; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
}

// GET — list all users (admin only)
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.crmUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, displayName: true, email: true, role: true, bookingSlug: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ users });
}

// POST — create new user (admin only)
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, displayName, role } = await request.json();

  if (!email || !displayName || !role) {
    return NextResponse.json({ error: 'Email, display name, and role are required.' }, { status: 400 });
  }
  if (!['ADMIN', 'MEMBER'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  const existing = await prisma.crmUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.crmUser.create({
    data: { email: email.toLowerCase().trim(), displayName, passwordHash, role },
    select: { id: true, displayName: true, email: true, role: true, bookingSlug: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ user, tempPassword }, { status: 201 });
}

// PATCH — update a user (admin only)
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, displayName, email, role, bookingSlug, isActive } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId is required.' }, { status: 400 });

  // Email uniqueness check
  if (email) {
    const existing = await prisma.crmUser.findFirst({
      where: { email: email.toLowerCase().trim(), NOT: { id: userId } },
    });
    if (existing) return NextResponse.json({ error: 'That email is already taken.' }, { status: 409 });
  }

  // Booking slug uniqueness check
  if (bookingSlug) {
    const existing = await prisma.crmUser.findFirst({
      where: { bookingSlug, NOT: { id: userId } },
    });
    if (existing) return NextResponse.json({ error: 'That booking slug is already taken.' }, { status: 409 });
  }

  // Prevent self-deactivation
  if (isActive === false && userId === session.userId) {
    return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
  }

  const user = await prisma.crmUser.update({
    where: { id: userId },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
      ...(role !== undefined && { role }),
      ...(bookingSlug !== undefined && { bookingSlug: bookingSlug || null }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, displayName: true, email: true, role: true, bookingSlug: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ user });
}
