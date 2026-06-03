import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import type { Invoice, InvoiceLineItem, Contact } from '@platform/vyntrize-db';

// ---------------------------------------------------------------------------
// Stripe client singleton
// ---------------------------------------------------------------------------

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripeClient(): Stripe {
  if (!stripeSecretKey) {
    throw new Error(
      '[StripeService] STRIPE_SECRET_KEY is not set. Add it to your .env file.'
    );
  }
  return new Stripe(stripeSecretKey, {
    apiVersion: '2026-05-27.dahlia',
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvoiceWithRelations extends Invoice {
  lineItems: InvoiceLineItem[];
  deal: {
    id: string;
    title: string;
    contactId: string | null;
    lead: {
      contact: Contact | null;
    };
  };
}

export interface StripeSyncResult {
  success: boolean;
  stripeInvoiceId?: string;
  stripePaymentUrl?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// StripeService
// ---------------------------------------------------------------------------

class StripeService {
  /**
   * Ensure a Stripe Customer exists for the given Contact.
   * If the contact already has a stripeCustomerId it is returned immediately.
   * Otherwise a new Stripe Customer is created and saved back to the DB.
   */
  async ensureCustomer(contact: Contact): Promise<string> {
    const stripe = getStripeClient();

    if (contact.stripeCustomerId) {
      return contact.stripeCustomerId;
    }

    console.log(`[StripeService] Creating Stripe customer for ${contact.email}`);

    const customer = await stripe.customers.create({
      email: contact.email,
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      phone: contact.phone ?? undefined,
      metadata: {
        crmContactId: contact.id,
      },
    });

    // Persist the Stripe customer ID back to our DB
    await prisma.contact.update({
      where: { id: contact.id },
      data: { stripeCustomerId: customer.id },
    });

    console.log(`[StripeService] Created Stripe customer ${customer.id} for contact ${contact.id}`);
    return customer.id;
  }

  /**
   * Sync a local Invoice to Stripe:
   * 1. Ensure a Stripe customer exists for the contact.
   * 2. Create (or retrieve) a Stripe Invoice with line items.
   * 3. Finalize and send the invoice — generates a hosted payment URL.
   * 4. Persist the Stripe IDs back to the local Invoice record.
   */
  async syncInvoice(invoiceId: string): Promise<StripeSyncResult> {
    const stripe = getStripeClient();

    // ------------------------------------------------------------------
    // 1. Fetch invoice with all needed relations
    // ------------------------------------------------------------------
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lineItems: true,
        deal: {
          include: {
            lead: {
              include: { contact: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      return { success: false, error: `Invoice ${invoiceId} not found` };
    }

    if (invoice.stripeInvoiceId) {
      return {
        success: true,
        stripeInvoiceId: invoice.stripeInvoiceId,
        stripePaymentUrl: invoice.stripePaymentUrl ?? undefined,
      };
    }

    // ------------------------------------------------------------------
    // 2. Resolve the contact (via deal → lead → contact)
    // ------------------------------------------------------------------
    const contact = invoice.deal.lead.contact;
    if (!contact) {
      return {
        success: false,
        error: 'Invoice deal has no associated contact. Cannot create Stripe customer.',
      };
    }

    try {
      // ------------------------------------------------------------------
      // 3. Ensure a Stripe customer exists
      // ------------------------------------------------------------------
      const stripeCustomerId = await this.ensureCustomer(contact);

      // ------------------------------------------------------------------
      // 4. Create the Stripe Invoice
      // ------------------------------------------------------------------
      const stripeInvoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        collection_method: 'send_invoice',
        due_date: Math.floor(new Date(invoice.dueDate).getTime() / 1000),
        currency: invoice.currency.toLowerCase(),
        description: `Invoice ${invoice.number} — ${invoice.deal.title}`,
        footer: invoice.notes ?? undefined,
        metadata: {
          crmInvoiceId: invoice.id,
          crmInvoiceNumber: invoice.number,
          crmDealId: invoice.dealId,
        },
        custom_fields: [
          { name: 'Invoice Number', value: invoice.number },
        ],
      });

      // ------------------------------------------------------------------
      // 5. Add line items as Stripe Invoice Items
      // ------------------------------------------------------------------
      for (const item of invoice.lineItems) {
        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          invoice: stripeInvoice.id,
          description: item.description,
          quantity: Math.round(Number(item.quantity)),
          amount: Math.round(Number(item.unitPrice) * 100), // Stripe uses cents
          currency: invoice.currency.toLowerCase(),
        });
      }

      // ------------------------------------------------------------------
      // 6. Apply discount if present
      // ------------------------------------------------------------------
      if (invoice.discount && Number(invoice.discount) > 0) {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(Number(invoice.discount) * 100),
          currency: invoice.currency.toLowerCase(),
          duration: 'once',
          name: `Discount on ${invoice.number}`,
        });
        await stripe.invoices.update(stripeInvoice.id, {
          discounts: [{ coupon: coupon.id }],
        });
      }

      // ------------------------------------------------------------------
      // 7. Finalize and send the invoice → get hosted payment URL
      // ------------------------------------------------------------------
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id);
      await stripe.invoices.sendInvoice(finalizedInvoice.id);

      const paymentUrl = finalizedInvoice.hosted_invoice_url ?? undefined;

      // ------------------------------------------------------------------
      // 8. Persist Stripe data back to local DB
      // ------------------------------------------------------------------
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          stripeInvoiceId: finalizedInvoice.id,
          stripePaymentUrl: paymentUrl,
          stripeStatus: finalizedInvoice.status,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      console.log(`[StripeService] Invoice ${invoice.number} synced → Stripe ID: ${finalizedInvoice.id}`);

      return {
        success: true,
        stripeInvoiceId: finalizedInvoice.id,
        stripePaymentUrl: paymentUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Stripe error';
      console.error('[StripeService] Failed to sync invoice:', error);
      return { success: false, error: message };
    }
  }

  /**
   * Handle the `invoice.paid` webhook from Stripe.
   * Finds the local invoice by stripeInvoiceId and marks it PAID.
   */
  async handleInvoicePaid(stripeInvoice: Stripe.Invoice): Promise<void> {
    const crmInvoiceId = stripeInvoice.metadata?.crmInvoiceId;
    if (!crmInvoiceId) {
      console.warn('[StripeService] invoice.paid received but no crmInvoiceId in metadata');
      return;
    }

    const amountPaid = stripeInvoice.amount_paid / 100; // Convert cents → dollars

    // Upsert payment record
    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: crmInvoiceId },
        data: {
          status: 'PAID',
          amountPaid: amountPaid,
          paidAt: new Date(),
          stripeStatus: stripeInvoice.status,
        },
      }),
      prisma.invoicePayment.create({
        data: {
          invoiceId: crmInvoiceId,
          amount: amountPaid,
          method: 'stripe',
          reference: (stripeInvoice as any).payment_intent as string | undefined ?? stripeInvoice.id,
          paidAt: new Date(),
          notes: `Automatically recorded via Stripe webhook. Payment Intent: ${(stripeInvoice as any).payment_intent ?? 'N/A'}`,
        },
      }),
    ]);

    console.log(`[StripeService] Invoice ${crmInvoiceId} marked as PAID via Stripe webhook`);
  }

  /**
   * Handle the `invoice.payment_failed` webhook.
   */
  async handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice): Promise<void> {
    const crmInvoiceId = stripeInvoice.metadata?.crmInvoiceId;
    if (!crmInvoiceId) return;

    await prisma.invoice.update({
      where: { id: crmInvoiceId },
      data: {
        stripeStatus: stripeInvoice.status,
        // Don't change local status — SENT is still accurate, payment just failed
      },
    });

    console.warn(`[StripeService] Payment failed for invoice ${crmInvoiceId} (Stripe: ${stripeInvoice.id})`);
  }

  /**
   * Retrieve the latest status of a Stripe invoice and sync it locally.
   */
  async refreshInvoiceStatus(invoiceId: string): Promise<void> {
    const stripe = getStripeClient();

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice?.stripeInvoiceId) return;

    const stripeInvoice = await stripe.invoices.retrieve(invoice.stripeInvoiceId);

    const statusMap: Record<string, 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED'> = {
      draft: 'DRAFT',
      open: 'SENT',
      paid: 'PAID',
      void: 'CANCELLED',
      uncollectible: 'OVERDUE' as 'CANCELLED',
    };

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        stripeStatus: stripeInvoice.status,
        stripePaymentUrl: stripeInvoice.hosted_invoice_url ?? invoice.stripePaymentUrl,
        status: statusMap[stripeInvoice.status ?? ''] ?? invoice.status,
      },
    });
  }
}

export const stripeService = new StripeService();
