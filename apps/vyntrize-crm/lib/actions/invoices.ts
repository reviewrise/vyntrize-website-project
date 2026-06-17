'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getCompanySettings } from '@/lib/actions/company-settings';
import { InvoiceStatus } from '@platform/vyntrize-db/src/generated/client';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Create Invoice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  return { success: true, id: invoice.id };
}

// â”€â”€â”€ Create Installment Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Atomically creates N installment invoices inside one transaction,
// ensuring sequential invoice numbers with no race conditions.

export type InstallmentInput = {
  label: string;
  amount: number;
  dueDate: Date;
  notes?: string;
};

export async function createInstallmentPlan(
  dealId: string,
  installments: InstallmentInput[],
  currency = 'USD',
) {
  await getSession();

  if (!installments.length) throw new Error('No installments provided');

  // Run everything in a single transaction to guarantee sequential numbers
  const invoices = await prisma.$transaction(async (tx) => {
    const year = new Date().getFullYear();

    // Lock-count inside transaction for safe sequential numbering
    const count = await tx.invoice.count({
      where: { number: { startsWith: `INV-${year}-` } },
    });

    const created = [];
    for (let i = 0; i < installments.length; i++) {
      const inst = installments[i];
      const seq = String(count + i + 1).padStart(3, '0');
      const number = `INV-${year}-${seq}`;

      const { subtotal, taxAmount, total } = calcTotals([
        { description: inst.label, quantity: 1, unitPrice: inst.amount },
      ]);

      const inv = await tx.invoice.create({
        data: {
          number,
          dealId,
          dueDate: inst.dueDate,
          currency,
          subtotal,
          taxAmount: taxAmount > 0 ? taxAmount : undefined,
          total,
          notes: inst.notes,
          lineItems: {
            create: [
              {
                description: inst.label,
                quantity: 1,
                unitPrice: inst.amount,
                total: inst.amount,
              },
            ],
          },
        },
        include: { lineItems: true },
      });

      created.push(inv);
    }

    return created;
  });

  revalidatePath('/invoices');
  revalidatePath(`/deals/${dealId}`);
  return { success: true };
}

// â”€â”€â”€ Update Invoice (draft only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  return { success: true, id: invoice.id };
}

// ─── Send Invoice ─────────────────────────────────────────────────────────────

export async function sendInvoice(id: string) {
  await getSession();

  // Fetch full invoice with contact info and line items
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id },
    include: {
      lineItems: { orderBy: { id: 'asc' } },
      payments: true,
      deal: {
        include: {
          lead: { include: { contact: true, company: true } },
        },
      },
    },
  });

  const company = await getCompanySettings();

  const contact = invoice.deal.lead.contact;
  const contactName = contact
    ? `${contact.firstName} ${contact.lastName}`.trim()
    : 'Valued Client';
  const contactEmail = contact?.email;

  const fmt = (n: any, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n));

  const lineItemsRows = invoice.lineItems
    .map(
      (li) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">${li.description}</td>
        <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px; text-align: center;">${Number(li.quantity)}</td>
        <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px; text-align: right;">${fmt(li.unitPrice, invoice.currency)}</td>
        <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${fmt(li.total, invoice.currency)}</td>
      </tr>`,
    )
    .join('');

  const issueDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(invoice.issueDate));
  const dueDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(invoice.dueDate));

  const statusBg = invoice.status === 'PAID' ? '#f0fdf4' : ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) ? '#eff6ff' : '#f1f5f9';
  const statusColor = invoice.status === 'PAID' ? '#22c55e' : ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) ? '#3b82f6' : '#64748b';

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.number} — ${company.name}</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <!-- Greeting -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 650px; margin: 0 auto 24px;">
    <tr>
      <td>
        <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #0f172a;">Hi ${contactName},</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
          Your invoice for <strong style="color: #0f172a;">${invoice.deal.title}</strong> is attached below.
        </p>

        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
          <tr>
            ${invoice.stripePaymentUrl && invoice.status !== 'PAID' ? `
            <td style="padding-right: 12px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background: #22c55e; border-radius: 6px;">
                    <a href="${invoice.stripePaymentUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">Pay Now Online</a>
                  </td>
                </tr>
              </table>
            </td>` : ''}
            <td>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background: #4f6ef7; border-radius: 6px;">
                    <a href="${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/pay/${invoice.id}" style="display: inline-block; padding: 12px 24px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
                      ${invoice.status !== 'PAID' ? 'View Full Invoice' : 'View Invoice Receipt'}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${invoice.status !== 'PAID' && company.paymentInstructions ? `
        <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
          <h4 style="margin: 0 0 8px; color: #0f172a; font-size: 14px;">Offline Payment Instructions</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; white-space: pre-wrap; font-family: ui-monospace, monospace;">${company.paymentInstructions}</p>
        </div>` : ''}
      </td>
    </tr>
  </table>

  <!-- Main Invoice Card -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 40px; border-bottom: 1px solid #f1f5f9;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="top">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${company.logoUrl ? `<td style="padding-right: 12px;"><img src="${company.logoUrl}" alt="Logo" style="max-height: 36px; max-width: 120px; object-fit: contain; display: block;" /></td>` : ''}
                  <td valign="middle">
                    <span style="font-size: ${company.logoUrl ? '18px' : '24px'}; font-weight: 800; letter-spacing: -0.5px; color: #4f6ef7;">${company.name}</span>
                  </td>
                </tr>
              </table>
              <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                ${company.address ? company.address.replace(/\n/g, ' &middot; ') : ''}<br />
                ${company.email} ${company.website ? `&middot; ${company.website.replace(/^https?:\/\//, '')}` : ''}
                ${company.taxId ? `<br />Tax ID: ${company.taxId}` : ''}
              </p>
            </td>
            <td valign="top" align="right">
              <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;">Invoice</p>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px;">${invoice.number}</h1>
              <div style="margin-top: 8px;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${statusBg}; color: ${statusColor};">
                  ${invoice.status.replace('_', ' ')}
                </span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Bill To + Dates -->
    <tr>
      <td style="padding: 32px 40px; border-bottom: 1px solid #f1f5f9;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="33%" valign="top">
              <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px;">Bill To</p>
              <p style="margin: 0 0 2px; font-size: 14px; font-weight: 600; color: #1e293b;">${contactName}</p>
              ${invoice.deal.lead.company?.name ? `<p style="margin: 0 0 2px; font-size: 13px; color: #64748b;">${invoice.deal.lead.company.name}</p>` : ''}
              <p style="margin: 0 0 2px; font-size: 13px; color: #64748b;">${contactEmail}</p>
              ${contact.phone ? `<p style="margin: 0; font-size: 13px; color: #64748b;">${contact.phone}</p>` : ''}
            </td>
            <td width="33%" valign="top">
              <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px;">For</p>
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${invoice.deal.title}</p>
            </td>
            <td width="33%" valign="top">
              <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px;">Dates</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; padding-bottom: 4px;">Issued</td>
                  <td style="font-size: 13px; color: #1e293b; padding-bottom: 4px; text-align: right;">${issueDate}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #94a3b8;">Due</td>
                  <td style="font-size: 13px; color: #1e293b; text-align: right;">${dueDate}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Line Items -->
    <tr>
      <td style="padding: 32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <thead>
            <tr>
              <th align="left" style="padding-bottom: 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0;">Description</th>
              <th align="center" style="padding-bottom: 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0;">Qty</th>
              <th align="right" style="padding-bottom: 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0;">Unit Price</th>
              <th align="right" style="padding-bottom: 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsRows}
          </tbody>
        </table>

        <!-- Totals -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
          <tr>
            <td width="50%"></td>
            <td width="50%">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${Number(invoice.subtotal) !== Number(invoice.total) ? `
                <tr>
                  <td align="left" style="padding: 6px 0; font-size: 13px; color: #64748b;">Subtotal</td>
                  <td align="right" style="padding: 6px 0; font-size: 13px; color: #1e293b;">${fmt(invoice.subtotal, invoice.currency)}</td>
                </tr>` : ''}
                ${Number(invoice.discount) > 0 ? `
                <tr>
                  <td align="left" style="padding: 6px 0; font-size: 13px; color: #64748b;">Discount</td>
                  <td align="right" style="padding: 6px 0; font-size: 13px; color: #16a34a;">−${fmt(invoice.discount!, invoice.currency)}</td>
                </tr>` : ''}
                ${Number(invoice.taxAmount) > 0 ? `
                <tr>
                  <td align="left" style="padding: 6px 0; font-size: 13px; color: #64748b;">Tax (${Number(invoice.taxRate)}%)</td>
                  <td align="right" style="padding: 6px 0; font-size: 13px; color: #1e293b;">${fmt(invoice.taxAmount!, invoice.currency)}</td>
                </tr>` : ''}
                <tr>
                  <td align="left" style="padding: 12px 0 4px; font-size: 16px; font-weight: 800; color: #1e293b;">Total</td>
                  <td align="right" style="padding: 12px 0 4px; font-size: 16px; font-weight: 800; color: #4f6ef7;">${invoice.currency} ${fmt(invoice.total, invoice.currency).replace('$', '').replace('€', '').replace('£', '').trim()}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${invoice.notes ? `
        <!-- Notes -->
        <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-left: 4px solid #4f6ef7; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px;">Notes & Terms</p>
          <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">${invoice.notes.replace(/\n/g, '<br />')}</p>
        </div>` : ''}
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <p style="margin: 32px 0 0; text-align: center; font-size: 12px; color: #94a3b8;">
    Thank you for your business &middot; ${company.name} &middot; <a href="mailto:${company.email}" style="color: #4f6ef7; text-decoration: none;">${company.email}</a>
  </p>
</body>
</html>`;

  // -- Send the email -----------------------------------------------------------
  if (contactEmail) {
    const session = await getSession();
    const { emailService } = await import('@/lib/email/email-service');
    await emailService.sendEmail({
      role: 'billing',
      to: contactEmail,
      toName: contactName,
      subject: `Invoice ${invoice.number} from ${company.name} - ${fmt(invoice.total, invoice.currency)} due ${dueDate}`,
      html: htmlBody,
      leadId: invoice.deal.leadId,
      contactId: contact?.id,
      userId: session.userId as string | undefined,
      // Invoice already has its own fully-styled HTML shell with company branding
      // inline — skip the generic layout wrapper to avoid double-wrapping.
      skipLayout: true,
    });
  }

  // -- Mark as SENT in DB -------------------------------------------------------
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: 'SENT', sentAt: new Date() },
    include: { deal: { include: { lead: { include: { contact: true } } } }, lineItems: true },
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${id}`);
  return { success: true };
}
// â”€â”€â”€ Record Payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  return { success: true };
}

// â”€â”€â”€ Get Invoice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

export async function getPublicInvoice(id: string) {
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

// â”€â”€â”€ List Invoices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Dashboard revenue stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
