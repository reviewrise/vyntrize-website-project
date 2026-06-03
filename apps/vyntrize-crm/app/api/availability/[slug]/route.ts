import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';
import { getAvailableSlots } from '@/lib/availability';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get('date');

    if (!dateString) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // Lookup user by bookingSlug or ID
    const user = await db.crmUser.findFirst({
      where: {
        OR: [
          { bookingSlug: slug },
          { id: slug }
        ]
      },
      select: { 
        id: true, 
        displayName: true, 
        timezone: true,
        bookingSettings: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const slots = await getAvailableSlots(user.id, dateString);

    return NextResponse.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        timezone: user.timezone,
        durationMinutes: user.bookingSettings?.durationMinutes || 30,
        title: user.bookingSettings?.title || 'Book a Consultation',
        description: user.bookingSettings?.description || 'Pick a date and time that works best for you.',
      },
      date: dateString,
      slots
    });
  } catch (error: any) {
    console.error('Availability error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
