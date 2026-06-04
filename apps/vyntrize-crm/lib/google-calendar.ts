import { google } from 'googleapis';
import { vyntrizeDb } from '@platform/vyntrize-db';

export async function getGoogleCalendarClient(userId: string) {
  const account = await vyntrizeDb.connectedAccount.findFirst({
    where: { userId, provider: 'google' },
  });

  if (!account) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/api/auth/google/callback`;

  if (!clientId || !clientSecret || !redirectUri) return null;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiresAt?.getTime(),
  });

  // Auto-refresh token if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await vyntrizeDb.connectedAccount.update({
        where: { id: account.id },
        data: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });
    } else {
      await vyntrizeDb.connectedAccount.update({
        where: { id: account.id },
        data: {
          accessToken: tokens.access_token!,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function syncEventToGoogle(userId: string, eventData: any, existingExternalId?: string) {
  try {
    const calendar = await getGoogleCalendarClient(userId);
    if (!calendar) return null; // Not connected

    const resource = {
      summary: eventData.title,
      description: eventData.description || '',
      location: eventData.location || '',
      start: eventData.isAllDay
        ? { date: eventData.startTime.toISOString().split('T')[0] }
        : { dateTime: eventData.startTime.toISOString() },
      end: eventData.isAllDay
        ? { date: eventData.endTime.toISOString().split('T')[0] }
        : { dateTime: eventData.endTime.toISOString() },
    };

    if (eventData.attendees && Array.isArray(eventData.attendees)) {
      (resource as any).attendees = eventData.attendees;
    }

    if (eventData.generateMeetLink) {
      (resource as any).conferenceData = {
        createRequest: {
          requestId: `meet_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      };
    }

    if (existingExternalId) {
      const res = await calendar.events.update({
        calendarId: 'primary',
        eventId: existingExternalId,
        requestBody: resource,
        conferenceDataVersion: eventData.generateMeetLink ? 1 : 0,
        sendUpdates: 'none', // We send our own branded email
      });
      return { id: res.data.id, hangoutLink: res.data.hangoutLink };
    } else {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: resource,
        conferenceDataVersion: eventData.generateMeetLink ? 1 : 0,
        sendUpdates: 'none', // We send our own branded email
      });
      return { id: res.data.id, hangoutLink: res.data.hangoutLink };
    }
  } catch (error) {
    console.error('Failed to sync event to Google Calendar:', error);
    return null;
  }
}

export async function deleteEventFromGoogle(userId: string, externalId: string) {
  try {
    const calendar = await getGoogleCalendarClient(userId);
    if (!calendar) return;

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: externalId,
    });
  } catch (error) {
    console.error('Failed to delete event from Google Calendar:', error);
  }
}
