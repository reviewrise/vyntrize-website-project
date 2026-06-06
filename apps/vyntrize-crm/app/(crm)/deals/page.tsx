import { listDeals, getDealStats } from '@/lib/actions/deals';
import { DealStatusBadge } from '@/components/InvoiceStatusBadge';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Briefcase, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { DealsClient } from './DealsClient';
import { DealsSetupNotice } from './DealsSetupNotice';

export const metadata = { title: 'Deals — VyntRise CRM' };

export default async function DealsPage() {
  const [deals, stats, leads, contactCount] = await Promise.all([
    listDeals(),
    getDealStats(),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        contactId: true,
        companyId: true,
        contact: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.contact.count(),
  ]);

  const hasLeads = leads.length > 0;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #4f6ef7, #7c5bf7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Briefcase style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Deals</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{deals.length} total</p>
          </div>
        </div>

        <DealsClient mode="new-button" leads={leads} hasLeads={hasLeads} contactCount={contactCount} />
      </div>

      <DealsSetupNotice contactCount={contactCount} leadCount={leads.length} />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[
          {
            label: 'Open Pipeline',
            value: `$${stats.totalOpenValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
            sub: `${stats.openDeals} open deals`,
            icon: TrendingUp,
            color: '#4f6ef7',
          },
          {
            label: 'Won Deals',
            value: stats.wonDeals.toString(),
            sub: 'all time',
            icon: CheckCircle,
            color: '#22c55e',
          },
          {
            label: 'Revenue This Month',
            value: `$${stats.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
            sub: 'from payments',
            icon: DollarSign,
            color: '#f59e0b',
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.625rem',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '0.5rem',
                backgroundColor: `${color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: 18, height: 18, color }} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0 0 0.2rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </p>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.1rem', letterSpacing: '-0.02em' }}>
                {value}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', margin: 0 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Deals table */}
      {deals.length === 0 ? (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: '0.75rem',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <Briefcase style={{ width: 40, height: 40, color: 'var(--color-text-subtle)', margin: '0 auto 0.875rem' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.375rem' }}>No deals yet</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0, maxWidth: '28rem', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            {hasLeads
              ? 'Select a lead and add deal details to get started.'
              : 'Follow the steps above to add a contact and lead first — then you can create deals here.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Deal', 'Contact', 'Value', 'Invoices', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--color-text-subtle)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textAlign: 'left',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const totalInvoiced = deal.invoices.reduce((s, inv) => s + Number(inv.total), 0);
                return (
                  <tr
                    key={deal.id}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                        {deal.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', margin: '0.1rem 0 0' }}>
                        {new Date(deal.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', margin: 0 }}>
                        {deal.lead.contact.firstName} {deal.lead.contact.lastName}
                      </p>
                      {deal.lead.company && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.1rem 0 0' }}>
                          {deal.lead.company.name}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                        ${Number(deal.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', margin: '0.1rem 0 0' }}>
                        {deal.currency}
                      </p>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', margin: 0 }}>
                        {deal.invoices.length} invoice{deal.invoices.length !== 1 ? 's' : ''}
                      </p>
                      {totalInvoiced > 0 && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', margin: '0.1rem 0 0' }}>
                          ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })} invoiced
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <DealStatusBadge status={deal.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <Link
                        href={`/deals/${deal.id}`}
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
