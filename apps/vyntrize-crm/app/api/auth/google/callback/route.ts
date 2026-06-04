import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/settings/integrations?error=oauth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings/integrations?error=no_code', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/api/auth/google/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info to store their email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    const providerId = userInfo.data.id;

    if (!email || !providerId) {
      throw new Error('Could not get user email from Google');
    }

    // Save tokens in ConnectedAccount
    await vyntrizeDb.connectedAccount.upsert({
      where: {
        provider_providerId: {
          provider: 'google',
          providerId: providerId,
        },
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope,
        userId: session.userId,
      },
      create: {
        provider: 'google',
        providerId: providerId,
        email: email,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope,
        userId: session.userId,
      },
    });

    return NextResponse.redirect(new URL('/settings/integrations?success=true', request.url));
  } catch (error) {
    console.error('Error handling Google callback:', error);
    return NextResponse.redirect(new URL('/settings/integrations?error=oauth_error', request.url));
  }
}
