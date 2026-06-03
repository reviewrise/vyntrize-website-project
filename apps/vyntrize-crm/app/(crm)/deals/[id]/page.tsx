import { getDeal } from '@/lib/actions/deals';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, Briefcase } from 'lucide-react';
import { DealStatusBadge, InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { DealDetailClient } from './DealDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  return { title: deal ? `${deal.title} — VyntRise CRM` : 'Deal Not Found' };
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const contact = deal.lead.contact;
  const company = deal.lead.company;
  const totalInvoiced = deal.invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const totalPaid = deal.invoices.reduce((s, inv) => s + Number(inv.amountPaid), 0);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
      {/* Back */}
      <Link
        href="/deals"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          marginBottom: '1.25rem',
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Back to Deals
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left — Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Deal card */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.25rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #4f6ef7, #7c5bf7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Briefcase style={{ width: 18, height: 18, color: '#fff' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                    {deal.title}
                  </h1>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.15rem 0 0' }}>
                    Created {new Date(deal.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DealStatusBadge status={deal.status} />
                <DealDetailClient deal={{ ...deal, value: Number(deal.value) }} mode="edit-button" />
              </div>
            </div>

            {/* Deal stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '1.25rem', gap: '1rem' }}>
              {[
                { label: 'Deal Value', value: `$${Number(deal.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${deal.currency}` },
                { label: 'Total Invoiced', value: `$${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                { label: 'Total Collected', value: `$${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {deal.notes && (
              <div style={{ padding: '0 1.25rem 1.25rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.375rem' }}>
                  Notes
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6 }}>{deal.notes}</p>
              </div>
            )}
          </div>

          {/* Invoices section */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                  Invoices ({deal.invoices.length})
                </span>
              </div>
              <DealDetailClient deal={{ ...deal, value: Number(deal.value) }} mode="new-invoice-button" />
            </div>

            {deal.invoices.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                <Receipt style={{ width: 32, height: 32, color: 'var(--color-text-subtle)', margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>No invoices yet</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Number', 'Issued', 'Due', 'Total', 'Paid', 'Status', ''].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.625rem 1rem',
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
                  {deal.invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                        {inv.number}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                        ${Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#22c55e', fontWeight: 500 }}>
                        ${Number(inv.amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <Link
                          href={`/invoices/${inv.id}`}
                          style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right — Contact sidebar */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
          }}
        >
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.875rem' }}>
            Client
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '0.875rem',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f6ef7, #7c5bf7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {contact.firstName[0]}{contact.lastName[0]}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                {contact.firstName} {contact.lastName}
              </p>
              {company && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.1rem 0 0' }}>{company.name}</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', margin: '0 0 0.1rem', fontWeight: 600 }}>Email</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text)', margin: 0 }}>{contact.email}</p>
            </div>
            {contact.phone && (
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', margin: '0 0 0.1rem', fontWeight: 600 }}>Phone</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text)', margin: 0 }}>{contact.phone}</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <Link
              href={`/leads/${deal.leadId}`}
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                textDecoration: 'none',
                padding: '0.5rem',
                border: '1px solid var(--color-primary)',
                borderRadius: '0.5rem',
              }}
            >
              View Lead →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
