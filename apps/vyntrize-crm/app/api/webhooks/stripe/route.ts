import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripeService } from '@/lib/services/stripe-service';

/**
 * POST /api/webhooks/stripe
 *
 * Receives Stripe events and processes them. The raw body must be forwarded
 * as-is for signature verification, so this route uses the `edge` runtime
 * alternative pattern — we read the raw buffer before parsing.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET  (from `stripe listen` or the Stripe Dashboard)
 */

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  if (!webhookSecret) {
    console.error('[StripeWebhook] STRIPE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // ── Read raw body for signature verification ───────────────────────────────
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-05-27.dahlia',
    });
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[StripeWebhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook signature error: ${message}` }, { status: 400 });
  }

  console.log(`[StripeWebhook] Received event: ${event.type} (${event.id})`);

  // ── Event Handlers ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'invoice.paid': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        await stripeService.handleInvoicePaid(stripeInvoice);
        break;
      }

      case 'invoice.payment_failed': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        await stripeService.handleInvoicePaymentFailed(stripeInvoice);
        break;
      }

      case 'invoice.payment_action_required':
      case 'invoice.overdue': {
        // Mark as OVERDUE in local DB
        const stripeInvoice = event.data.object as Stripe.Invoice;
        const crmInvoiceId = stripeInvoice.metadata?.crmInvoiceId;
        if (crmInvoiceId) {
          const { prisma } = await import('@/lib/prisma');
          await prisma.invoice.update({
            where: { id: crmInvoiceId },
            data: { status: 'OVERDUE', stripeStatus: stripeInvoice.status },
          });
          console.log(`[StripeWebhook] Invoice ${crmInvoiceId} marked OVERDUE`);
        }
        break;
      }

      case 'invoice.voided': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        const crmInvoiceId = stripeInvoice.metadata?.crmInvoiceId;
        if (crmInvoiceId) {
          const { prisma } = await import('@/lib/prisma');
          await prisma.invoice.update({
            where: { id: crmInvoiceId },
            data: { status: 'CANCELLED', stripeStatus: 'void' },
          });
          console.log(`[StripeWebhook] Invoice ${crmInvoiceId} marked CANCELLED (voided in Stripe)`);
        }
        break;
      }

      case 'customer.deleted': {
        // Clear the stripeCustomerId so it gets re-created on next sync
        const customer = event.data.object as Stripe.Customer;
        const { prisma } = await import('@/lib/prisma');
        await prisma.contact.updateMany({
          where: { stripeCustomerId: customer.id },
          data: { stripeCustomerId: null },
        });
        console.log(`[StripeWebhook] Cleared stripeCustomerId for Stripe customer ${customer.id}`);
        break;
      }

      default:
        // Unhandled event — log and acknowledge
        console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[StripeWebhook] Error processing event ${event.type}:`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
