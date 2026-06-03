import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { stripeService } from '@/lib/services/stripe-service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/invoices/[id]/sync
 *
 * Syncs a local CRM invoice to Stripe:
 *  1. Creates (or reuses) a Stripe Customer for the contact.
 *  2. Creates the Stripe Invoice with all line items.
 *  3. Finalizes + sends the Stripe Invoice.
 *  4. Returns the hosted payment URL.
 *
 * GET /api/invoices/[id]/sync
 *  Refreshes the local invoice status from Stripe.
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Validate invoice exists and belongs to this CRM
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, number: true, status: true, stripeInvoiceId: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.stripeInvoiceId) {
    return NextResponse.json(
      {
        error: 'Invoice is already synced to Stripe.',
        stripeInvoiceId: invoice.stripeInvoiceId,
      },
      { status: 409 }
    );
  }

  if (invoice.status === 'CANCELLED' || invoice.status === 'PAID') {
    return NextResponse.json(
      { error: `Cannot sync an invoice with status: ${invoice.status}` },
      { status: 400 }
    );
  }

  const result = await stripeService.syncInvoice(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Return the updated invoice with Stripe data
  const updatedInvoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: true, payments: true },
  });

  return NextResponse.json({
    success: true,
    invoice: updatedInvoice,
    stripeInvoiceId: result.stripeInvoiceId,
    paymentUrl: result.stripePaymentUrl,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { stripeInvoiceId: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (!invoice.stripeInvoiceId) {
    return NextResponse.json(
      { error: 'Invoice has not been synced to Stripe yet.' },
      { status: 404 }
    );
  }

  await stripeService.refreshInvoiceStatus(id);

  const refreshed = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: true, payments: true },
  });

  return NextResponse.json({ success: true, invoice: refreshed });
}
