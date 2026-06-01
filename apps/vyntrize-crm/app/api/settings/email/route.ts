import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/email-service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await emailService.getConfig();

    return NextResponse.json({ config });
  } catch (error) {
    console.error('[Email Settings API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate body
    const { host, port, secure, user, pass, fromAddress, fromName, replyTo } = body;

    const config = {
      host: host || '',
      port: typeof port === 'string' ? parseInt(port) : port || 587,
      secure: secure === true,
      user: user || '',
      pass: pass || '',
      fromAddress: fromAddress || '',
      fromName: fromName || '',
      replyTo: replyTo || '',
    };

    await prisma.systemSetting.upsert({
      where: { key: 'EMAIL_CONFIG' },
      update: { value: config },
      create: { key: 'EMAIL_CONFIG', value: config },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('[Email Settings API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
