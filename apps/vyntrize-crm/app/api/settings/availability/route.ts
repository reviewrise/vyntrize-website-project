import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session || !session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let rules = await db.availabilityRule.findMany({
    where: { userId: session.userId },
    orderBy: { dayOfWeek: 'asc' }
  });

  let settings = await db.bookingSettings.findUnique({
    where: { userId: session.userId }
  });

  // Seed default rules if none exist
  if (rules.length === 0) {
    const defaultRules = [1, 2, 3, 4, 5].map(dayOfWeek => ({
      userId: session.userId,
      dayOfWeek,
      startHour: 9,
      startMin: 0,
      endHour: 17,
      endMin: 0,
      isActive: true,
    }));
    // Sat and Sun inactive
    defaultRules.push({ userId: session.userId, dayOfWeek: 0, startHour: 9, startMin: 0, endHour: 17, endMin: 0, isActive: false });
    defaultRules.push({ userId: session.userId, dayOfWeek: 6, startHour: 9, startMin: 0, endHour: 17, endMin: 0, isActive: false });
    
    await db.availabilityRule.createMany({ data: defaultRules });
    rules = await db.availabilityRule.findMany({ where: { userId: session.userId }, orderBy: { dayOfWeek: 'asc' } });
  }

  // Seed default settings if none exist
  if (!settings) {
    settings = await db.bookingSettings.create({
      data: {
        userId: session.userId,
      }
    });
  }

  return NextResponse.json({ rules, settings });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rules, settings } = await request.json();

  try {
    if (rules && Array.isArray(rules)) {
      for (const rule of rules) {
        await db.availabilityRule.upsert({
          where: { userId_dayOfWeek: { userId: session.userId, dayOfWeek: rule.dayOfWeek } },
          update: {
            startHour: rule.startHour,
            startMin: rule.startMin,
            endHour: rule.endHour,
            endMin: rule.endMin,
            isActive: rule.isActive,
          },
          create: {
            userId: session.userId,
            dayOfWeek: rule.dayOfWeek,
            startHour: rule.startHour,
            startMin: rule.startMin,
            endHour: rule.endHour,
            endMin: rule.endMin,
            isActive: rule.isActive,
          }
        });
      }
    }

    if (settings) {
      await db.bookingSettings.upsert({
        where: { userId: session.userId },
        update: {
          title: settings.title,
          description: settings.description,
          durationMinutes: settings.durationMinutes,
          bufferMinutes: settings.bufferMinutes,
          generateMeet: settings.generateMeet,
        },
        create: {
          userId: session.userId,
          title: settings.title,
          description: settings.description,
          durationMinutes: settings.durationMinutes,
          bufferMinutes: settings.bufferMinutes,
          generateMeet: settings.generateMeet,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save availability error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
