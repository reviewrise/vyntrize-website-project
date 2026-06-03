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

    const roles = ['admin', 'sales', 'billing', 'support'] as const;
    const configs: Record<string, any> = {};
    
    // Fetch all keys at once to prevent connection pool exhaustion and warnings
    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'EMAIL_CONFIG' } }
    });

    for (const role of roles) {
      const settingKey = `EMAIL_CONFIG_${role.toUpperCase()}`;
      let setting = settings.find(s => s.key === settingKey);
      
      if (!setting && role !== 'admin') {
        setting = settings.find(s => s.key === 'EMAIL_CONFIG_ADMIN');
      }
      if (!setting) {
        setting = settings.find(s => s.key === 'EMAIL_CONFIG');
      }
      
      // Fallback structure
      configs[role] = setting?.value || {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
        fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@vyntrize.com',
        fromName: process.env.EMAIL_FROM_NAME || 'Vyntrize CRM',
        replyTo: process.env.EMAIL_REPLY_TO
      };
    }

    return NextResponse.json({ configs, config: configs.admin }); // config is returned for backwards compatibility
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
    const { role, host, port, secure, user, pass, fromAddress, fromName, replyTo } = body;

    const targetRole = role || 'admin';
    const validRoles = ['admin', 'sales', 'billing', 'support'];
    if (!validRoles.includes(targetRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

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

    const settingKey = `EMAIL_CONFIG_${targetRole.toUpperCase()}`;

    await prisma.systemSetting.upsert({
      where: { key: settingKey },
      update: { value: config },
      create: { key: settingKey, value: config },
    });

    return NextResponse.json({ success: true, config, role: targetRole });
  } catch (error) {
    console.error('[Email Settings API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
