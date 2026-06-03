import { prisma } from '@/lib/prisma';

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'] as const;
const OPEN_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'] as const;

export interface DashboardData {
    leadCountByStage: Record<string, number>;
    dealValueByStage: Record<string, number>;
    recentActivities: Array<{
        id: string;
        type: string;
        body: string;
        createdAt: Date;
        user: { displayName: string };
        leadId: string | null;
        contactId: string | null;
        lead: { title: string } | null;
        contact: { firstName: string; lastName: string } | null;
    }>;
    totalContacts: number;
    totalCompanies: number;
    totalOpenDealValue: number;
    revenueThisMonth: number;
    outstandingInvoices: number;
}

export async function getDashboardData(): Promise<DashboardData> {
    const [leads, recentActivities, totalContacts, totalCompanies, monthlyRevenueAgg, invoicesAgg] =
        await prisma.$transaction([
            prisma.lead.findMany({
                select: {
                    stage: true,
                    dealValue: true,
                },
            }),
            prisma.activity.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    user: { select: { displayName: true } },
                    lead: { select: { title: true } },
                    contact: { select: { firstName: true, lastName: true } },
                },
            }),
            prisma.contact.count({ where: { deletedAt: null } }),
            prisma.company.count(),
            prisma.invoicePayment.aggregate({
                where: {
                    paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                },
                _sum: { amount: true }
            }),
            prisma.invoice.aggregate({
                where: { status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
                _sum: { total: true, amountPaid: true }
            })
        ]);

    const leadCountByStage: Record<string, number> = {};
    const dealValueByStage: Record<string, number> = {};

    for (const stage of STAGES) {
        leadCountByStage[stage] = 0;
        dealValueByStage[stage] = 0;
    }

    let totalOpenDealValue = 0;

    for (const lead of leads) {
        leadCountByStage[lead.stage] = (leadCountByStage[lead.stage] ?? 0) + 1;
        if (lead.dealValue) {
            const val = parseFloat(lead.dealValue.toString());
            dealValueByStage[lead.stage] = (dealValueByStage[lead.stage] ?? 0) + val;
            if (OPEN_STAGES.includes(lead.stage as typeof OPEN_STAGES[number])) {
                totalOpenDealValue += val;
            }
        }
    }

    const totalOutstanding = Number(invoicesAgg._sum.total ?? 0) - Number(invoicesAgg._sum.amountPaid ?? 0);

    return {
        leadCountByStage,
        dealValueByStage,
        recentActivities,
        totalContacts,
        totalCompanies,
        totalOpenDealValue,
        revenueThisMonth: Number(monthlyRevenueAgg._sum.amount ?? 0),
        outstandingInvoices: totalOutstanding,
    };
}
