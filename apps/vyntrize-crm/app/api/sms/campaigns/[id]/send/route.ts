/**
 * POST /api/sms/campaigns/[id]/send
 *
 * Sends (or re-queues) the campaign. Works for DRAFT and SCHEDULED campaigns.
 * Uses sequential batched sending with a 50ms delay between each message
 * to avoid throttling the SMS provider.
 *
 * Body: { recipients: [{ contactId, phone, name }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession }               from '@/lib/session';
import { prisma }                   from '@/lib/prisma';
import { sendCustomerSms }          from '@/lib/sms/send-customer-sms';
import { TemplateRenderer }         from '@/lib/email/template-renderer';

type Params = { params: Promise<{ id: string }> };

const BATCH_DELAY_MS = 50;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json() as { recipients?: { contactId: string; phone: string; name?: string }[] };

    const campaign = await (prisma as any).smsCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      return NextResponse.json({ error: `Cannot send a campaign in ${campaign.status} status` }, { status: 400 });
    }

    // Resolve recipients
    let recipients = body.recipients;

    if (!recipients || recipients.length === 0) {
      // If no recipients provided, fetch from targetType/targetFilter
      if (campaign.targetType === 'all') {
        const contacts = await prisma.contact.findMany({
          where:  { phone: { not: null }, smsOptOut: false },
          select: { id: true, phone: true, firstName: true, lastName: true },
        });
        recipients = contacts.map(c => ({
          contactId: c.id,
          phone:     c.phone!,
          name:      `${c.firstName} ${c.lastName}`.trim(),
        }));
      } else {
        return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 });
    }

    // Mark campaign as SENDING
    await (prisma as any).smsCampaign.update({
      where: { id },
      data:  {
        status:          'SENDING',
        sentAt:          new Date(),
        totalRecipients: recipients.length,
        sentCount:       0,
        failedCount:     0,
      },
    });

    // Send in background — respond immediately with 202 Accepted
    (async () => {
      let sentCount    = 0;
      let failedCount  = 0;

      for (const recipient of recipients!) {
        try {
          const contact = await prisma.contact.findUnique({
            where:  { id: recipient.contactId },
            select: {
              id: true, firstName: true, lastName: true,
              company: { select: { name: true } }, email: true, phone: true,
            },
          });

          const variables: Record<string, string> = {
            firstName:   contact?.firstName || '',
            lastName:    contact?.lastName  || '',
            companyName: contact?.company?.name || '',
            email:       contact?.email || '',
            phone:       recipient.phone,
          };

          const renderedMessage = TemplateRenderer.render(campaign.message, variables);

          const result = await sendCustomerSms({
            to:        recipient.phone,
            message:   renderedMessage,
            contactId: recipient.contactId,
          });

          // Update the smsLog with campaignId
          // sendCustomerSms already creates the log; find it and link to campaign
          const latestLog = await (prisma as any).smsLog.findFirst({
            where:   { contactId: recipient.contactId },
            orderBy: { createdAt: 'desc' },
          });

          if (latestLog) {
            await (prisma as any).smsLog.update({
              where: { id: latestLog.id },
              data:  { campaignId: id },
            });
          }

          if (result.sent) {
            sentCount++;
          } else {
            failedCount++;
          }

          // Update stats periodically (every 10 sends)
          if ((sentCount + failedCount) % 10 === 0 || (sentCount + failedCount) === recipients!.length) {
            await (prisma as any).smsCampaign.update({
              where: { id },
              data:  { sentCount, failedCount },
            });
          }
        } catch (err) {
          console.error(`[SMS Campaign send] Error sending to ${recipient.phone}:`, err);
          failedCount++;
        }

        // Rate limiting delay
        await sleep(BATCH_DELAY_MS);
      }

      // Mark completed
      await (prisma as any).smsCampaign.update({
        where: { id },
        data:  {
          status:      'SENT',
          completedAt: new Date(),
          sentCount,
          failedCount,
        },
      });

      console.log(`[SMS Campaign ${id}] Completed. Sent: ${sentCount}, Failed: ${failedCount}`);
    })().catch(err => {
      console.error(`[SMS Campaign ${id}] Fatal error during send:`, err);
      (prisma as any).smsCampaign.update({
        where: { id },
        data:  { status: 'FAILED' },
      }).catch(() => {});
    });

    return NextResponse.json({
      success:         true,
      totalRecipients: recipients.length,
      message:         'Campaign is being sent in the background.',
    }, { status: 202 });

  } catch (error) {
    console.error('[POST /api/sms/campaigns/[id]/send]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
