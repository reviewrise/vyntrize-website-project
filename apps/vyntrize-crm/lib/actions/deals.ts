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

  const deal = await prisma.deal.create({
    data: {
      title: input.title,
      leadId: input.leadId,
      contactId: input.contactId,
      companyId: input.companyId,
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
