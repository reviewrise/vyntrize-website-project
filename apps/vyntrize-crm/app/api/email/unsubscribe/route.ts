/**
 * Email Unsubscribe API
 * POST /api/email/unsubscribe
 * GET /api/email/unsubscribe?email=...&token=... (for email links)
 */

import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email, reason } = data;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Check if already unsubscribed
    const existing = await vyntrizeDb.emailUnsubscribe.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Email already unsubscribed',
      });
    }

    // Find contact by email
    const contact = await vyntrizeDb.contact.findUnique({
      where: { email },
      select: { id: true },
    });

    // Add to unsubscribe list
    await vyntrizeDb.emailUnsubscribe.create({
      data: {
        email,
        reason: reason || null,
        contactId: contact?.id || null,
      },
    });

    console.log('[Unsubscribe API] Email unsubscribed:', email);

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
    });
  } catch (error) {
    console.error('[Unsubscribe API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html>
<head>
  <title>Unsubscribe - Vyntrize CRM</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    .error {
      color: #dc2626;
      padding: 20px;
      background: #fee2e2;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="error">
    <h1>Invalid Unsubscribe Link</h1>
    <p>The unsubscribe link is invalid or has expired.</p>
  </div>
</body>
</html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Check if already unsubscribed
    const existing = await vyntrizeDb.emailUnsubscribe.findUnique({
      where: { email },
    });

    if (existing) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html>
<head>
  <title>Already Unsubscribed - Vyntrize CRM</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    .success {
      color: #059669;
      padding: 20px;
      background: #d1fae5;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="success">
    <h1>Already Unsubscribed</h1>
    <p>This email address (${email}) is already unsubscribed from our mailing list.</p>
  </div>
</body>
</html>
        `,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Find contact
    const contact = await vyntrizeDb.contact.findUnique({
      where: { email },
      select: { id: true },
    });

    // Add to unsubscribe list
    await vyntrizeDb.emailUnsubscribe.create({
      data: {
        email,
        contactId: contact?.id || null,
      },
    });

    console.log('[Unsubscribe API] Email unsubscribed via link:', email);

    return new NextResponse(
      `
<!DOCTYPE html>
<html>
<head>
  <title>Unsubscribed - Vyntrize CRM</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    .success {
      color: #059669;
      padding: 20px;
      background: #d1fae5;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info {
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="success">
    <h1>✓ Successfully Unsubscribed</h1>
    <p>You have been unsubscribed from our mailing list.</p>
    <p><strong>${email}</strong></p>
  </div>
  <div class="info">
    <p>You will no longer receive marketing emails from Vyntrize CRM.</p>
    <p>If you unsubscribed by mistake, please contact us.</p>
  </div>
</body>
</html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('[Unsubscribe API] Error:', error);
    return new NextResponse(
      `
<!DOCTYPE html>
<html>
<head>
  <title>Error - Vyntrize CRM</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    .error {
      color: #dc2626;
      padding: 20px;
      background: #fee2e2;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="error">
    <h1>Error</h1>
    <p>An error occurred while processing your unsubscribe request.</p>
    <p>Please try again later or contact support.</p>
  </div>
</body>
</html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
