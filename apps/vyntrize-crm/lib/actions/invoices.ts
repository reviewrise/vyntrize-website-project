'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { InvoiceStatus } from '@platform/vyntrize-db/src/generated/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceCreateInput = {
  dealId: string;
  dueDate: Date;
  lineItems: LineItemInput[];
  taxRate?: number;       // percentage, e.g. 16
  discount?: number;      // absolute amount
  notes?: string;
  currency?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTotals(
  lineItems: LineItemInput[],
  taxRate?: number,
  discount?: number,
) {
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const discountAmt = discount ?? 0;
  const taxable = subtotal - discountAmt;
  const taxAmount = taxRate ? taxable * (taxRate / 100) : 0;
  const total = taxable + taxAmount;
  return { subtotal, discountAmt, taxAmount, total };
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { number: { startsWith: `INV-${year}-` } },
  });
  const seq = String(count + 1).padStart(3, '0');
  return `INV-${year}-${seq}`;
}

async function refreshInvoiceStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    select: { total: true, amountPaid: true, dueDate: true, status: true },
  });

  const total = Number(invoice.total);
  const paid = Number(invoice.amountPaid);
  const overdue = invoice.dueDate < new Date();

  let status: InvoiceStatus = invoice.status as InvoiceStatus;
  if (paid >= total && total > 0) {
    status = 'PAID';
  } else if (paid > 0) {
    status = 'PARTIALLY_PAID';
  } else if (overdue && status === 'SENT') {
    status = 'OVERDUE';
  }

  if (status !== invoice.status) {
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
  }
  return status;
}

// ─── Create Invoice ───────────────────────────────────────────────────────────

export async function createInvoice(input: InvoiceCreateInput) {
  await getSession();

  const number = await nextInvoiceNumber();
  const { subtotal, discountAmt, taxAmount, total } = calcTotals(
    input.lineItems,
    input.taxRate,
    input.discount,
  );

  const invoice = await prisma.invoice.create({
    data: {
      number,
      dealId: input.dealId,
      dueDate: input.dueDate,
      currency: input.currency ?? 'USD',
      subtotal,
      taxRate: input.taxRate,
      taxAmount: taxAmount > 0 ? taxAmount : undefined,
      discount: discountAmt > 0 ? discountAmt : undefined,
      total,
      notes: input.notes,
      lineItems: {
        create: input.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          total: li.quantity * li.unitPrice,
        })),
      },
    },
    include: { lineItems: true, payments: true, deal: true },
  });

  revalidatePath('/invoices');
  revalidatePath(`/deals/${input.dealId}`);
  return invoice;
}

// ─── Update Invoice (draft only) ─────────────────────────────────────────────

export async function updateInvoice(
  id: string,
  input: Partial<InvoiceCreateInput>,
) {
  await getSession();

  const existing = await prisma.invoice.findUniqueOrThrow({ where: { id } });
  if (existing.status !== 'DRAFT') {
    throw new Error('Only DRAFT invoices can be edited');
  }

  let lineData = undefined;
  if (input.lineItems) {
    const { subtotal, discountAmt, taxAmount, total } = calcTotals(
      input.lineItems,
      input.taxRate ?? Number(existing.taxRate) ?? undefined,
      input.discount ?? Number(existing.discount) ?? undefined,
    );
    lineData = {
      subtotal,
      taxAmount: taxAmount > 0 ? taxAmount : null,
      discount: discountAmt > 0 ? discountAmt : null,
      total,
      lineItems: {
        deleteMany: { invoiceId: id },
        create: input.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          total: li.quantity * li.unitPrice,
        })),
      },
    };
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(input.dueDate && { dueDate: input.dueDate }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.taxRate !== undefined && { taxRate: input.taxRate }),
      ...(input.discount !== undefined && { discount: input.discount }),
      ...(input.currency && { currency: input.currency }),
      ...lineData,
    },
    include: { lineItems: true, payments: true },
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${id}`);
  return invoice;
}

// ─── Send Invoice ─────────────────────────────────────────────────────────────

export async function sendInvoice(id: string) {
  await getSession();

  // Fetch full invoice with contact info and line items
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id },
    include: {
      lineItems: { orderBy: { id: 'asc' } },
      deal: {
        include: {
          lead: { include: { contact: true } },
        },
      },
    },
  });

  const contact = invoice.deal.lead.contact;
  const contactName = contact
    ? `${contact.firstName} ${contact.lastName}`.trim()
    : 'Valued Client';
  const contactEmail = contact?.email;

  // ── Build email HTML ──────────────────────────────────────────────────────
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3014';
  const BRAND_COLOR = '#0f172a';
  const ACCENT_COLOR = '#3b82f6';

  const fmt = (n: any, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n));

  const lineItemsRows = invoice.lineItems
    .map(
      (li) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px;">${li.description}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; text-align: center;">${Number(li.quantity)}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; text-align: right;">${fmt(li.unitPrice, invoice.currency)}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${fmt(li.total, invoice.currency)}</td>
      </tr>`,
    )
    .join('');

  const dueDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(invoice.dueDate));

  const stripeButton = invoice.stripePaymentUrl
    ? `<div style="text-align: center; margin: 32px 0;">
        <a href="${invoice.stripePaymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #635bff, #0070f3); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(99,91,255,0.3);">
          Pay Now — ${fmt(invoice.total, invoice.currency)}
        </a>
        <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">Secure payment powered by Stripe</p>
      </div>`
    : `<p style="margin: 24px 0; padding: 16px; background: #f8fafc; border-radius: 8px; color: #475569; font-size: 14px; text-align: center;">
        Please arrange payment by <strong>${dueDate}</strong>. Contact us for bank transfer details.
      </p>`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background: ${BRAND_COLOR}; padding: 32px 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">VyntRise</h1>
            <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Invoice ${invoice.number}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 40px;">
            <div style="text-align: center; margin-bottom: 28px;">
              <div style="display: inline-block; background: #e0e7ff; color: #4338ca; padding: 8px 18px; border-radius: 50px; font-weight: 700; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">Invoice</div>
            </div>

            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Hi ${contactName},</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
              Please find your invoice from <strong>VyntRise</strong> for <strong>${invoice.deal.title}</strong>. 
              Payment is due by <strong>${dueDate}</strong>.
            </p>

            <!-- Invoice Meta -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 13px; color: #64748b; font-weight: 600; padding: 6px 0;">Invoice Number</td>
                  <td style="font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; padding: 6px 0;">${invoice.number}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; font-weight: 600; padding: 6px 0;">Issue Date</td>
                  <td style="font-size: 13px; color: #0f172a; text-align: right; padding: 6px 0;">${new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(invoice.issueDate))}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; font-weight: 600; padding: 6px 0;">Due Date</td>
                  <td style="font-size: 13px; color: #ef4444; font-weight: 600; text-align: right; padding: 6px 0;">${dueDate}</td>
                </tr>
              </table>
            </div>

            <!-- Line Items -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
              <thead>
                <tr>
                  <th style="text-align: left; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">Description</th>
                  <th style="text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">Qty</th>
                  <th style="text-align: right; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">Unit Price</th>
                  <th style="text-align: right; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">Total</th>
                </tr>
              </thead>
              <tbody>${lineItemsRows}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
              ${Number(invoice.discount) > 0 ? `<tr><td style="font-size: 14px; color: #64748b; padding: 6px 0;">Subtotal</td><td style="text-align: right; font-size: 14px; color: #334155; padding: 6px 0;">${fmt(invoice.subtotal, invoice.currency)}</td></tr><tr><td style="font-size: 14px; color: #64748b; padding: 6px 0;">Discount</td><td style="text-align: right; font-size: 14px; color: #16a34a; padding: 6px 0;">−${fmt(invoice.discount!, invoice.currency)}</td></tr>` : ''}
              ${Number(invoice.taxAmount) > 0 ? `<tr><td style="font-size: 14px; color: #64748b; padding: 6px 0;">Tax (${Number(invoice.taxRate)}%)</td><td style="text-align: right; font-size: 14px; color: #334155; padding: 6px 0;">${fmt(invoice.taxAmount!, invoice.currency)}</td></tr>` : ''}
              <tr>
                <td style="font-size: 16px; color: #0f172a; font-weight: 700; padding: 14px 0 0; border-top: 2px solid #0f172a;">Total Due</td>
                <td style="text-align: right; font-size: 20px; color: #0f172a; font-weight: 800; padding: 14px 0 0; border-top: 2px solid #0f172a;">${fmt(invoice.total, invoice.currency)}</td>
              </tr>
            </table>

            ${stripeButton}

            ${invoice.notes ? `<div style="background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;"><p style="margin: 0; font-size: 14px; color: #475569;"><strong>Note:</strong> ${invoice.notes}</p></div>` : ''}

            <p style="color: #94a3b8; font-size: 13px; margin: 32px 0 0; text-align: center;">
              Questions? Reply to this email or contact us directly.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} VyntRise. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── Send the email ────────────────────────────────────────────────────────
  if (contactEmail) {
    const { emailService } = await import('@/lib/email/email-service');
    await emailService.sendEmail({
      role: 'billing',
      to: contactEmail,
      toName: contactName,
      subject: `Invoice ${invoice.number} from VyntRise — ${fmt(invoice.total, invoice.currency)} due ${dueDate}`,
      html: htmlBody,
      leadId: invoice.deal.leadId,
      contactId: contact?.id,
    });
  }

  // ── Mark as SENT in DB ────────────────────────────────────────────────────
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: 'SENT', sentAt: new Date() },
    include: { deal: { include: { lead: { include: { contact: true } } } }, lineItems: true },
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${id}`);
  return updated;
}


// ─── Record Payment ───────────────────────────────────────────────────────────

export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: string,
  reference?: string,
  notes?: string,
  paidAt?: Date,
) {
  await getSession();

  const payment = await prisma.invoicePayment.create({
    data: {
      invoiceId,
      amount,
      method,
      reference,
      notes,
      paidAt: paidAt ?? new Date(),
    },
  });

  // Recalculate amountPaid
  const agg = await prisma.invoicePayment.aggregate({
    where: { invoiceId },
    _sum: { amount: true },
  });
  const totalPaid = Number(agg._sum.amount ?? 0);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid: totalPaid },
  });

  const newStatus = await refreshInvoiceStatus(invoiceId);

  // If fully paid, set paidAt
  if (newStatus === 'PAID') {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { paidAt: new Date() },
    });
  }

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${invoiceId}`);
  return payment;
}

// ─── Get Invoice ─────────────────────────────────────────────────────────────

export async function getInvoice(id: string) {
  await getSession();

  return prisma.invoice.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { id: 'asc' } },
      payments: { orderBy: { paidAt: 'desc' } },
      deal: {
        include: {
          lead: { include: { contact: true, company: true } },
        },
      },
    },
  });
}

// ─── List Invoices ────────────────────────────────────────────────────────────

export type InvoiceListFilters = {
  status?: InvoiceStatus;
  dealId?: string;
  search?: string;
};

export async function listInvoices(filters: InvoiceListFilters = {}) {
  await getSession();

  return prisma.invoice.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.dealId && { dealId: filters.dealId }),
      ...(filters.search && {
        OR: [
          { number: { contains: filters.search, mode: 'insensitive' } },
          { deal: { title: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
    },
    include: {
      deal: { include: { lead: { include: { contact: true } } } },
      lineItems: { select: { id: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Dashboard revenue stats ──────────────────────────────────────────────────

export async function getInvoiceStats() {
  await getSession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [outstanding, monthlyRevenue, overdueCount] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
      _sum: { total: true },
    }),
    prisma.invoicePayment.aggregate({
      where: { paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.invoice.count({ where: { status: 'OVERDUE' } }),
  ]);

  return {
    outstanding: Number(outstanding._sum.total ?? 0),
    monthlyRevenue: Number(monthlyRevenue._sum.amount ?? 0),
    overdueCount,
  };
}
