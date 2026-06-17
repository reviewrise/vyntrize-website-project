/**
 * POST /api/email/send-meeting-link
 *
 * Creates a Google Meet, saves a CalendarEvent, and emails the contact
 * a branded invitation with the actual meet.google.com link.
 *
 * Two modes:
 *   1. scheduledTime provided → create Google Calendar event + Meet link
 *   2. No scheduledTime      → send a "pick a time" booking-page link email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/email-service';
import { syncEventToGoogle } from '@/lib/google-calendar';
import crypto from 'crypto';

interface SendMeetingLinkRequest {
  to: string;
  toName?: string;
  contactId?: string;
  leadId?: string;
  personalNote?: string;

  // If provided → schedule a real Google Meet
  scheduledTime?: {
    startISO: string;  // e.g. "2026-06-20T14:00:00"
    endISO: string;    // e.g. "2026-06-20T14:30:00"
    title?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as SendMeetingLinkRequest;

    if (!body.to) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const userId = session.userId as string;

    // ── Fetch session user ────────────────────────────────────────────────
    const sessionUser = await prisma.crmUser.findUnique({
      where: { id: userId },
      select: { displayName: true, email: true, bookingSlug: true },
    });
    const senderName = sessionUser?.displayName ?? 'Our team';

    const crmBase = process.env.NEXT_PUBLIC_CRM_URL?.replace(/\/$/, '') ?? 'https://crm.vyntrise.com';
    const firstName = body.toName?.split(' ')[0] ?? 'there';
    const personalNoteHtml = body.personalNote
      ? `<p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">${body.personalNote}</p>`
      : '';

    // ── MODE 1: Schedule a specific Google Meet ───────────────────────────
    if (body.scheduledTime) {
      const { startISO, endISO, title } = body.scheduledTime;
      const startTime = new Date(startISO);
      const endTime = new Date(endISO);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return NextResponse.json({ error: 'Invalid date/time values' }, { status: 400 });
      }

      const eventTitle = title || `Meeting with ${body.toName ?? body.to}`;

      // Try to create Google Calendar event + Meet link
      const cancelToken = crypto.randomUUID();
      const rescheduleToken = crypto.randomUUID();

      // Resolve lead/contact for DB record
      let contactId = body.contactId;
      if (!contactId && body.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: body.leadId },
          select: { contactId: true },
        });
        contactId = lead?.contactId ?? undefined;
      }

      // Save calendar event
      const calEvent = await prisma.calendarEvent.create({
        data: {
          title: eventTitle,
          description: body.personalNote || '',
          startTime,
          endTime,
          isAllDay: false,
          userId,
          ...(contactId ? { contactId } : {}),
          ...(body.leadId ? { leadId: body.leadId } : {}),
          cancelToken,
          rescheduleToken,
        },
      });

      // Sync to Google Calendar → generates Meet link
      const googleResult = await syncEventToGoogle(userId, {
        title: eventTitle,
        description: body.personalNote || '',
        startTime,
        endTime,
        isAllDay: false,
        generateMeetLink: true,
        attendees: [{ email: body.to }],
      });

      let meetLink: string | null = null;
      if (googleResult) {
        meetLink = googleResult.hangoutLink ?? null;
        await prisma.calendarEvent.update({
          where: { id: calEvent.id },
          data: {
            externalId: googleResult.id ?? null,
            meetLink,
            syncedAt: new Date(),
          },
        });
      }

      // ── Format the date/time for the email ────────────────────────────
      const fmt = (d: Date) =>
        d.toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        });
      const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const htmlBody = `
        <p style="margin:0 0 20px; font-size:16px; color:#0f172a; font-weight:600;">Hi ${firstName},</p>

        ${personalNoteHtml}

        <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
          I've scheduled a meeting for us. Here are the details:
        </p>

        <!-- Meeting details card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
          <tr>
            <td style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:18px; font-weight:700; color:#0f172a;">${eventTitle}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:6px;">
                    <span style="font-size:13px; color:#64748b;">📅 &nbsp;</span>
                    <span style="font-size:14px; color:#1e293b;">${fmt(startTime)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:${meetLink ? '16px' : '0'};">
                    <span style="font-size:13px; color:#64748b;">⏱ &nbsp;</span>
                    <span style="font-size:14px; color:#1e293b;">${durationMins} minutes</span>
                  </td>
                </tr>
                ${meetLink ? `
                <tr>
                  <td style="padding-top:16px; border-top:1px solid #e2e8f0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1a73e8; border-radius:8px; padding:0;">
                          <a href="${meetLink}"
                             style="display:inline-block; padding:13px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none;">
                            📹 &nbsp;Join Google Meet
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:10px 0 0; font-size:12px; color:#94a3b8; word-break:break-all;">${meetLink}</p>
                  </td>
                </tr>` : `
                <tr>
                  <td style="padding-top:16px; border-top:1px solid #e2e8f0;">
                    <p style="margin:0; font-size:13px; color:#64748b; font-style:italic;">
                      Google Meet link will be added soon. You'll receive an updated invite.
                    </p>
                  </td>
                </tr>`}
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:20px 0 0; font-size:14px; line-height:1.7; color:#64748b;">
          Looking forward to speaking with you!
        </p>
      `;

      const subject = meetLink
        ? `Meeting Invitation: ${eventTitle}`
        : `Meeting Scheduled: ${eventTitle}`;

      const result = await emailService.sendEmail({
        role: 'sales',
        to: body.to,
        toName: body.toName,
        subject,
        html: htmlBody,
        leadId: body.leadId,
        contactId,
        userId,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to send' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        mode: 'scheduled',
        meetLink,
        calendarEventId: calEvent.id,
        messageId: result.messageId,
      });
    }

    // ── MODE 2: No time specified — send booking page link ────────────────
    const bookingSlug = sessionUser?.bookingSlug;
    const bookingUrl = bookingSlug
      ? `${crmBase}/book/${bookingSlug}`
      : `${crmBase}/book`;

    const htmlBody = `
      <p style="margin:0 0 20px; font-size:16px; color:#0f172a; font-weight:600;">Hi ${firstName},</p>

      ${personalNoteHtml}

      <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
        I'd love to connect. Pick a time that works for you and we'll get a Google Meet booked instantly.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a73e8; border-radius:10px; padding:0;">
                  <a href="${bookingUrl}"
                     style="display:inline-block; padding:16px 36px; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none;">
                    📅 &nbsp;Book a Meeting
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px; font-size:13px; color:#94a3b8;">
        Or copy this link: <a href="${bookingUrl}" style="color:#1a73e8; text-decoration:none; word-break:break-all;">${bookingUrl}</a>
      </p>

      <p style="margin:0; font-size:14px; line-height:1.7; color:#64748b;">
        Looking forward to speaking with you!
      </p>
    `;

    const result = await emailService.sendEmail({
      role: 'sales',
      to: body.to,
      toName: body.toName,
      subject: `Book a meeting with ${senderName}`,
      html: htmlBody,
      leadId: body.leadId,
      contactId: body.contactId,
      userId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mode: 'booking-link',
      bookingUrl,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('[send-meeting-link] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
