/**
 * InvoicePreview — premium professional invoice layout for screen, print, and PDF.
 */

import type { ReactNode } from 'react';

interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  total: number | string;
}

interface InvoicePayment {
  id: string;
  amount: number | string;
  method: string;
  reference?: string | null;
  paidAt: Date | string;
}

interface InvoicePreviewProps {
  invoice: {
    number: string;
    issueDate: Date | string;
    dueDate: Date | string;
    status: string;
    currency: string;
    subtotal: number | string;
    taxRate?: number | string | null;
    taxAmount?: number | string | null;
    discount?: number | string | null;
    total: number | string;
    amountPaid: number | string;
    notes?: string | null;
    lineItems: InvoiceLineItem[];
    payments: InvoicePayment[];
    deal: {
      title: string;
      lead: {
        contact: {
          firstName: string;
          lastName: string;
          email: string;
          phone?: string | null;
        };
        company?: { name: string; website?: string | null } | null;
      };
    };
  };
  printMode?: boolean;
  companySettings?: {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    address: string;
    taxId?: string;
    logoUrl?: string;
  } | null;
}

const DEFAULT_LOGO_URL = '/images/logo.png';

/* Premium palette */
const INK = '#0B101A';
const INK_MID = '#1E293B';
const MUTED = '#64748B';
const SUBTLE = '#94A3B8';
const BORDER = '#E8ECF0';
const SURFACE = '#F7F8FA';
const ACCENT = '#4F6EF7';
const ACCENT_END = '#7C5BF7';

const statusStyles: Record<string, { bg: string; color: string; dot: string }> = {
  DRAFT:          { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
  SENT:           { bg: '#EEF2FF', color: '#4338CA', dot: '#6366F1' },
  PARTIALLY_PAID: { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  PAID:           { bg: '#ECFDF5', color: '#047857', dot: '#10B981' },
  OVERDUE:        { bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' },
  CANCELLED:      { bg: '#F8FAFC', color: '#94A3B8', dot: '#CBD5E1' },
};

const methodLabel: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  cheque: 'Cheque',
  mobile_money: 'Mobile Money',
  other: 'Other',
};

function fmtCurrency(n: number | string, currency = 'USD') {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function fmtQty(n: number | string) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.625rem',
        fontWeight: 600,
        color: SUBTLE,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        marginBottom: '0.5rem',
      }}
    >
      {children}
    </div>
  );
}

function MetaRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'baseline' }}>
      <span style={{ fontSize: '0.8125rem', color: MUTED, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: '0.8125rem',
          color: highlight ? ACCENT : INK_MID,
          fontWeight: highlight ? 600 : 500,
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function CompanyBrand({
  name,
  logoUrl,
  address,
  email,
  phone,
  website,
  taxId,
}: {
  name: string;
  logoUrl: string;
  address: string;
  email: string;
  phone?: string;
  website: string;
  taxId?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
      <img
        src={logoUrl}
        alt={`${name} logo`}
        style={{ width: 44, height: 44, objectFit: 'contain', display: 'block', flexShrink: 0, marginTop: '0.125rem' }}
      />
      <div>
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: INK,
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: '0.8125rem',
            color: MUTED,
            marginTop: '0.5rem',
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
            maxWidth: '20rem',
          }}
        >
          {address}
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.5rem', lineHeight: 1.7 }}>
          {email}
          {phone && (
            <>
              <br />
              {phone}
            </>
          )}
          <br />
          {website}
          {taxId && (
            <>
              <br />
              Tax ID: {taxId}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? statusStyles.DRAFT;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.3125rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.625rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {status.replace('_', ' ')}
    </span>
  );
}

export function InvoicePreview({ invoice, printMode = false, companySettings }: InvoicePreviewProps) {
  const remaining = Number(invoice.total) - Number(invoice.amountPaid);
  const contact = invoice.deal.lead.contact;
  const clientCompany = invoice.deal.lead.company;
  const currency = invoice.currency || 'USD';
  const isOverdue = invoice.status === 'OVERDUE';

  const companyName = companySettings?.name || 'VyntRise';
  const companyEmail = companySettings?.email || 'hello@vyntrize.com';
  const companyAddress = companySettings?.address || '205 Van Buren Street, Suite 120\nHerndon, VA 20170';
  const companyWebsite = companySettings?.website?.replace(/^https?:\/\//, '') || 'vyntrize.com';
  const logoUrl = companySettings?.logoUrl?.trim() || DEFAULT_LOGO_URL;

  const pad = '2.75rem';

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { margin: 0.45in; size: auto; }
              html, body { background: #fff !important; }
              .invoice-screen-only { display: none !important; }
              #invoice-print-area {
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              #invoice-print-area table { page-break-inside: auto; }
              #invoice-print-area tr { page-break-inside: avoid; page-break-after: auto; }
              #invoice-print-area thead { display: table-header-group; }
            }
          `,
        }}
      />
    <div
      id="invoice-print-area"
      style={{
        background: '#ffffff',
        color: INK,
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        maxWidth: '50rem',
        margin: '0 auto',
        borderRadius: printMode ? 0 : '0.75rem',
        border: printMode ? 'none' : `1px solid ${BORDER}`,
        boxShadow: printMode
          ? 'none'
          : '0 0 0 1px rgba(15, 23, 42, 0.03), 0 2px 4px rgba(15, 23, 42, 0.04), 0 12px 48px rgba(15, 23, 42, 0.07)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >

      {/* Status pipeline — screen only */}
      {!printMode && invoice.status !== 'CANCELLED' && (
        <div
          className="invoice-screen-only"
          style={{
            padding: '1rem 2.75rem',
            background: SURFACE,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem' }}>
            {[
              { label: 'Draft', done: invoice.status !== 'DRAFT', active: invoice.status === 'DRAFT' },
              {
                label: 'Sent',
                done: ['PARTIALLY_PAID', 'PAID'].includes(invoice.status),
                active: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status),
              },
              { label: 'Paid', done: invoice.status === 'PAID', active: invoice.status === 'PAID' },
            ].map((step, i, arr) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      background: step.done ? ACCENT : step.active ? INK : '#fff',
                      color: step.done || step.active ? '#fff' : SUBTLE,
                      border: `2px solid ${step.done ? ACCENT : step.active ? INK : BORDER}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      color: step.done || step.active ? INK : SUBTLE,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    style={{
                      width: 48,
                      height: 1,
                      background: step.done ? ACCENT : BORDER,
                      marginBottom: '1.25rem',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ padding: `${pad} ${pad} 2rem` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
          <CompanyBrand
            name={companyName}
            logoUrl={logoUrl}
            address={companyAddress}
            email={companyEmail}
            phone={companySettings?.phone}
            website={companyWebsite}
            taxId={companySettings?.taxId}
          />

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <StatusBadge status={invoice.status} />
            <div
              style={{
                marginTop: '1rem',
                fontSize: '2rem',
                fontWeight: 300,
                letterSpacing: '-0.04em',
                color: INK,
                lineHeight: 1,
              }}
            >
              {invoice.number}
            </div>
            <div style={{ fontSize: '0.6875rem', color: SUBTLE, marginTop: '0.375rem', letterSpacing: '0.1em' }}>
              INVOICE REFERENCE
            </div>
          </div>
        </div>
      </div>

      {/* ── Parties + meta ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px',
          background: BORDER,
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        {/* Bill To */}
        <div style={{ background: '#fff', padding: '1.75rem 2.75rem' }}>
          <Label>Bill To</Label>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}>
            {contact.firstName} {contact.lastName}
          </div>
          {clientCompany && (
            <div style={{ fontSize: '0.875rem', color: MUTED, marginTop: '0.25rem' }}>{clientCompany.name}</div>
          )}
          <div style={{ fontSize: '0.8125rem', color: MUTED, marginTop: '0.625rem', lineHeight: 1.8 }}>
            {contact.email}
            {contact.phone && <><br />{contact.phone}</>}
          </div>
        </div>

        {/* Invoice details */}
        <div style={{ background: SURFACE, padding: '1.75rem 2.75rem' }}>
          <Label>Details</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <MetaRow label="Issue date" value={fmtDate(invoice.issueDate)} />
            <MetaRow label="Due date" value={fmtDate(invoice.dueDate)} highlight={isOverdue} />
            <MetaRow label="Project" value={invoice.deal.title} />
            <MetaRow label="Currency" value={currency} />
          </div>
        </div>
      </div>

      {/* ── Line items ── */}
      <div style={{ paddingBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col />
            <col style={{ width: '5rem' }} />
            <col style={{ width: '7.5rem' }} />
            <col style={{ width: '8rem' }} />
          </colgroup>
          <thead>
            <tr>
              {[
                { label: 'Description', align: 'left' as const, padSide: 'left' as const },
                { label: 'Qty', align: 'right' as const, padSide: 'none' as const },
                { label: 'Rate', align: 'right' as const, padSide: 'none' as const },
                { label: 'Amount', align: 'right' as const, padSide: 'right' as const },
              ].map((col) => (
                <th
                  key={col.label}
                  style={{
                    padding: '0.75rem 1rem',
                    paddingLeft: col.padSide === 'left' ? pad : '1rem',
                    paddingRight: col.padSide === 'right' ? pad : '1rem',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    textAlign: col.align,
                    background: INK,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li, index) => (
              <tr
                key={li.id}
                style={{
                  borderBottom: `1px solid ${BORDER}`,
                  background: index % 2 === 0 ? '#fff' : '#FDFDFE',
                }}
              >
                <td style={{ padding: '0.875rem 1rem', paddingLeft: pad, fontSize: '0.875rem', color: INK_MID, lineHeight: 1.55 }}>
                  {li.description}
                </td>
                <td
                  style={{
                    padding: '0.875rem 1rem',
                    fontSize: '0.875rem',
                    color: MUTED,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtQty(li.quantity)}
                </td>
                <td
                  style={{
                    padding: '0.875rem 1rem',
                    fontSize: '0.875rem',
                    color: MUTED,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtCurrency(li.unitPrice, currency)}
                </td>
                <td
                  style={{
                    padding: '0.875rem 1rem',
                    paddingRight: pad,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: INK,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtCurrency(li.total, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingRight: pad, paddingLeft: pad }}>
          <div style={{ width: '20rem' }}>
            {[
              { label: 'Subtotal', value: fmtCurrency(invoice.subtotal, currency) },
              ...(invoice.discount && Number(invoice.discount) > 0
                ? [{ label: 'Discount', value: `−${fmtCurrency(invoice.discount, currency)}` }]
                : []),
              ...(invoice.taxRate && Number(invoice.taxRate) > 0
                ? [{ label: `Tax (${invoice.taxRate}%)`, value: fmtCurrency(invoice.taxAmount ?? 0, currency) }]
                : []),
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                <span style={{ fontSize: '0.8125rem', color: MUTED }}>{label}</span>
                <span style={{ fontSize: '0.8125rem', color: INK_MID, fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </span>
              </div>
            ))}

            {/* Total due hero */}
            <div
              style={{
                marginTop: '1rem',
                padding: '1.25rem 1.375rem',
                background: `linear-gradient(135deg, ${INK} 0%, #1a2744 100%)`,
                borderRadius: '0.625rem',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 3,
                  height: '100%',
                  background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT_END})`,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Total Due
                </span>
                <span
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmtCurrency(invoice.total, currency)}
                </span>
              </div>
            </div>

            {Number(invoice.amountPaid) > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.125rem 0',
                    marginTop: '0.625rem',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: '#059669' }}>Paid to date</span>
                  <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    −{fmtCurrency(invoice.amountPaid, currency)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.875rem 1rem',
                    marginTop: '0.5rem',
                    background: remaining > 0 ? '#FFFBEB' : '#ECFDF5',
                    borderRadius: '0.5rem',
                    border: `1px solid ${remaining > 0 ? '#FDE68A' : '#A7F3D0'}`,
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: INK }}>Balance remaining</span>
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: remaining > 0 ? '#B45309' : '#047857',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {fmtCurrency(remaining, currency)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment history */}
      {invoice.payments.length > 0 && (
        <div style={{ padding: `0 ${pad} 2rem` }}>
          <Label>Payment History</Label>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: '0.625rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: SURFACE }}>
                  {['Date', 'Method', 'Reference', 'Amount'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: '0.75rem 1rem',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: SUBTLE,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        textAlign: i === 3 ? 'right' : 'left',
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: MUTED }}>
                      {fmtDate(p.paidAt)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: INK_MID, fontWeight: 500 }}>
                      {methodLabel[p.method] ?? p.method}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: MUTED }}>
                      {p.reference || '—'}
                    </td>
                    <td
                      style={{
                        padding: '0.875rem 1rem',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#059669',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {fmtCurrency(p.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div style={{ padding: `0 ${pad} 2rem` }}>
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: SURFACE,
              borderRadius: '0.625rem',
              borderLeft: `3px solid ${ACCENT}`,
            }}
          >
            <Label>Notes &amp; Payment Terms</Label>
            <p style={{ fontSize: '0.8125rem', color: INK_MID, margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {invoice.notes}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '1.5rem 2.75rem',
          borderTop: `1px solid ${BORDER}`,
          background: SURFACE,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: '0.8125rem', color: MUTED, fontStyle: 'italic' }}>
          Thank you for your business.
        </div>
        <div style={{ fontSize: '0.75rem', color: SUBTLE }}>
          {companyName} · {companyEmail}
        </div>
      </div>
    </div>
    </>
  );
}
