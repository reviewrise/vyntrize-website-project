'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { DealStatus } from '@platform/vyntrize-db/src/generated/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DealCreateInput = {
  title: string;
  leadId: string;
  contactId?: string;
  companyId?: string;
  value: number;
  currency?: string;
  status?: DealStatus;
  notes?: string;
};

export type DealUpdateInput = Partial<DealCreateInput> & {
  closedAt?: Date | null;
};

// ─── Create Deal ──────────────────────────────────────────────────────────────

export async function createDeal(input: DealCreateInput) {
  await getSession(); // auth guard

  if (!input.leadId?.trim()) {
    throw new Error('A lead is required to create a deal.');
  }

  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: { id: true, contactId: true, companyId: true },
  });

  if (!lead) {
    throw new Error('The selected lead no longer exists.');
  }

  const deal = await prisma.deal.create({
    data: {
      title: input.title,
      leadId: lead.id,
      contactId: input.contactId ?? lead.contactId,
      companyId: input.companyId ?? lead.companyId,
      value: input.value,
      currency: input.currency ?? 'USD',
      status: input.status ?? 'OPEN',
      notes: input.notes,
    },
    include: { lead: { include: { contact: true } }, invoices: true },
  });

  revalidatePath('/deals');
  revalidatePath(`/leads/${input.leadId}`);
  return {
    ...deal,
    value: Number(deal.value),
    invoices: deal.invoices.map(inv => ({
      ...inv,
      total: Number(inv.total),
      amountPaid: Number(inv.amountPaid)
    }))
  };
}

// ─── Update Deal ──────────────────────────────────────────────────────────────

export async function updateDeal(id: string, input: DealUpdateInput) {
  await getSession();

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.value !== undefined && { value: input.value }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.closedAt !== undefined && { closedAt: input.closedAt }),
    },
    include: { lead: { include: { contact: true } }, invoices: true },
  });

  revalidatePath('/deals');
  revalidatePath(`/deals/${id}`);
  return {
    ...deal,
    value: Number(deal.value),
    invoices: deal.invoices.map(inv => ({
      ...inv,
      total: Number(inv.total),
      amountPaid: Number(inv.amountPaid)
    }))
  };
}

// ─── Get Deal ─────────────────────────────────────────────────────────────────

export async function getDeal(id: string) {
  await getSession();

  return prisma.deal.findUnique({
    where: { id },
    include: {
      lead: {
        include: {
          contact: true,
          company: true,
        },
      },
      invoices: {
        include: {
          lineItems: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

// ─── List Deals ───────────────────────────────────────────────────────────────

export type DealListFilters = {
  status?: DealStatus;
  leadId?: string;
  search?: string;
};

export async function listDeals(filters: DealListFilters = {}) {
  await getSession();

  return prisma.deal.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.leadId && { leadId: filters.leadId }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { lead: { contact: { firstName: { contains: filters.search, mode: 'insensitive' } } } },
          { lead: { contact: { lastName: { contains: filters.search, mode: 'insensitive' } } } },
        ],
      }),
    },
    include: {
      lead: { include: { contact: true, company: true } },
      invoices: { select: { id: true, status: true, total: true, amountPaid: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export async function getDealStats() {
  await getSession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [openDeals, wonDeals, totalOpenValue, monthlyRevenue] = await Promise.all([
    prisma.deal.count({ where: { status: 'OPEN' } }),
    prisma.deal.count({ where: { status: 'WON' } }),
    prisma.deal.aggregate({
      where: { status: 'OPEN' },
      _sum: { value: true },
    }),
    prisma.invoicePayment.aggregate({
      where: { paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  return {
    openDeals,
    wonDeals,
    totalOpenValue: Number(openDeals ? totalOpenValue._sum.value ?? 0 : 0),
    monthlyRevenue: Number(monthlyRevenue._sum.amount ?? 0),
  };
}

// ─── Send Proposal Email ─────────────────────────────────────────────────────

/**
 * Sends a branded proposal email for a deal to the associated contact.
 * The email uses the shared emailService (branded layout + billing footer)
 * and logs the send to EmailLog for tracking.
 */
export async function sendProposal(dealId: string) {
  const session = await getSession();

  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: {
      lead: {
        include: {
          contact: true,
          company: true,
          assignee: { select: { displayName: true, email: true, jobTitle: true, phone: true, role: true, bookingSlug: true } },
        },
      },
    },
  });

  const contact = deal.lead.contact;
  if (!contact?.email) {
    throw new Error('No email address found for this contact.');
  }

  const { getCompanySettings } = await import('@/lib/actions/company-settings');
  const company = await getCompanySettings();

  const contactName = `${contact.firstName} ${contact.lastName}`.trim();
  const assignee = deal.lead.assignee;
  const assigneeName = assignee?.displayName ?? company.name;
  const bookingSlug = assignee?.bookingSlug ?? null;
  const bookingUrl = bookingSlug
    ? `${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book/${bookingSlug}`
    : `${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book`;

  const fmt = (n: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  const dealValue = Number(deal.value);

  const htmlBody = `
    <p style="margin:0 0 20px; font-size:16px; color:#0f172a; font-weight:600;">Hi ${contact.firstName},</p>

    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
      Thank you for your interest. We're excited to share our proposal for
      <strong style="color:#0f172a;">${deal.title}</strong>.
    </p>

    <!-- Proposal value highlight -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%); border-radius:10px; padding:28px 32px; text-align:center;">
          <p style="margin:0 0 6px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:rgba(255,255,255,0.75);">
            Proposed Investment
          </p>
          <p style="margin:0; font-size:32px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
            ${fmt(dealValue, deal.currency)}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#374151;">
      This proposal covers everything we discussed. We're confident this represents
      excellent value for ${deal.lead.company?.name ?? 'your team'} and are ready to
      move forward as soon as you give the green light.
    </p>

    ${deal.notes ? `
    <!-- Scope / Notes -->
    <div style="background:#f8fafc; border-left:4px solid #4f46e5; border-radius:0 8px 8px 0; padding:16px 20px; margin:20px 0;">
      <p style="margin:0 0 8px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#94a3b8;">Scope Details</p>
      <p style="margin:0; font-size:14px; line-height:1.7; color:#475569; white-space:pre-wrap;">${deal.notes}</p>
    </div>` : ''}

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
      <tr>
        <td align="center">
          <a href="${bookingUrl}"
             style="display:inline-block; padding:14px 32px; background:#4f46e5; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; border-radius:8px; letter-spacing:-0.1px;">
            Schedule a Review Call
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0; font-size:14px; line-height:1.7; color:#64748b;">
      Questions? Just reply to this email — we're happy to walk through any details.
    </p>

    <p style="margin:24px 0 0; font-size:14px; color:#374151;">
      Best regards,<br>
      <strong>${assigneeName}</strong>
    </p>
  `;

  const { emailService } = await import('@/lib/email/email-service');
  await emailService.sendEmail({
    role: 'sales',
    to: contact.email,
    toName: contactName,
    subject: `Proposal: ${deal.title} — ${fmt(dealValue, deal.currency)}`,
    html: htmlBody,
    leadId: deal.leadId,
    contactId: contact.id,
    userId: session.userId as string | undefined,
  });

  revalidatePath(`/deals/${dealId}`);
  return { success: true };
}
