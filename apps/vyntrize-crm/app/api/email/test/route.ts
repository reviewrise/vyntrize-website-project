/**
 * Email Test & Diagnostics API
 * GET  /api/email/test  — verify SMTP connection and return config status
 * POST /api/email/test  — send a test email to a specified address
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { emailService, EmailRole } from '@/lib/email/email-service';
import { TemplateRenderer } from '@/lib/email/template-renderer';

// ─── GET: SMTP connection status ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = (searchParams.get('role') || 'admin') as EmailRole;

    const serviceStatus = await emailService.getStatus();
    const isConnected = await emailService.verifyConnection();

    // Fetch dynamic config instead of .env
    const config = await emailService.getConfig(role);

    return NextResponse.json({
      configured: serviceStatus.configured,
      initialized: true,
      connected: isConnected,
      config: {
        host: config.host || null,
        port: config.port || '587',
        secure: config.secure === true,
        user: config.user
          ? `${config.user.slice(0, 3)}***@${config.user.split('@')[1] ?? '***'}`
          : null,
        fromAddress: config.fromAddress || null,
        fromName: config.fromName || null,
      },
    });
  } catch (error) {
    console.error('[Email Test API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// ─── POST: Send a test email ──────────────────────────────────────────────────

interface TestEmailRequest {
  to: string;
  subject?: string;
  role?: EmailRole;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = (await request.json()) as TestEmailRequest;

    if (!data.to) {
      return NextResponse.json(
        { error: 'Missing required field: to' },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      return NextResponse.json(
        { error: `Invalid email address: ${data.to}` },
        { status: 400 }
      );
    }

    const subject = data.subject || 'Vyntrize CRM — Email Configuration Test';
    const sentAt = new Date().toUTCString();
    const role = data.role || 'admin';

    const config = await emailService.getConfig(role);

    const htmlBody = TemplateRenderer.wrapInEmailTemplate(
      `
      <h2 style="margin-top:0;color:#111827;">✅ Email Delivery Test</h2>
      <p>This is a test email sent from <strong>Vyntrize CRM</strong> to verify your SMTP configuration is working correctly.</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="background:#f9fafb;">
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600;width:140px;color:#374151;">Sent to</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#111827;">${data.to}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Sent at</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#111827;">${sentAt}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600;color:#374151;">SMTP Host</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#111827;">${config.host || 'Not configured'}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600;color:#374151;">From</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#111827;">${config.fromName || 'Vyntrize CRM'} &lt;${config.fromAddress || 'noreply@vyntrize.com'}&gt;</td>
        </tr>
      </table>


      <p style="color:#6b7280;font-size:14px;">
        If you received this email, your SMTP configuration is working correctly and Vyntrize CRM can send emails to your leads and contacts.
      </p>
      `,
      subject
    );

    const result = await emailService.sendEmail({
      role,
      to: data.to,
      subject,
      html: htmlBody,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send test email',
        },
        { status: 500 }
      );
    }

    console.log('[Email Test API] Test email sent to:', data.to);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      sentTo: data.to,
      sentAt,
    });
  } catch (error) {
    console.error('[Email Test API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
