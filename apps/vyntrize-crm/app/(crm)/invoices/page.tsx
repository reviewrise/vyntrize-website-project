import { listInvoices, getInvoiceStats } from '@/lib/actions/invoices';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import Link from 'next/link';
import { Receipt, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Invoices — VyntRise CRM' };

export default async function InvoicesPage() {
  const [invoices, stats] = await Promise.all([listInvoices(), getInvoiceStats()]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
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
            <Receipt style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Invoices</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{invoices.length} total</p>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[
          {
            label: 'Revenue This Month',
            value: `$${stats.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
            sub: 'payments received',
            icon: TrendingUp,
            color: '#22c55e',
          },
          {
            label: 'Outstanding',
            value: `$${stats.outstanding.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
            sub: 'unpaid invoices',
            icon: DollarSign,
            color: '#f59e0b',
          },
          {
            label: 'Overdue',
            value: stats.overdueCount.toString(),
            sub: 'past due date',
            icon: AlertTriangle,
            color: '#ef4444',
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

      {/* Invoice table */}
      {invoices.length === 0 ? (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: '0.75rem',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <Receipt style={{ width: 40, height: 40, color: 'var(--color-text-subtle)', margin: '0 auto 0.875rem' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.375rem' }}>No invoices yet</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Create invoices from a Deal page.
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
                {['#', 'Deal / Client', 'Issued', 'Due', 'Total', 'Paid', 'Balance', 'Status', ''].map((h) => (
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
              {invoices.map((inv) => {
                const balance = Number(inv.total) - Number(inv.amountPaid);
                const contact = inv.deal.lead.contact;
                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      {inv.number}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
                        {inv.deal.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.1rem 0 0' }}>
                        {contact.firstName} {contact.lastName}
                      </p>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      ${Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#22c55e', fontWeight: 500 }}>
                      ${Number(inv.amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: balance > 0 ? '#f59e0b' : '#22c55e' }}>
                      ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <Link
                        href={`/invoices/${inv.id}`}
                        style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
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
