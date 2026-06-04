/**
 * InvoicePreview — renders a professional invoice layout.
 * Used by the invoice detail page for display, and as the source
 * for the PDF generation API route.
 */

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
  /** When true, hides interactive action buttons (for PDF/print contexts) */
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

function fmt(n: number | string, currency = 'USD') {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const methodLabel: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  cheque: 'Cheque',
  mobile_money: 'Mobile Money',
  other: 'Other',
};

export function InvoicePreview({ invoice, printMode = false, companySettings }: InvoicePreviewProps) {
  const remaining = Number(invoice.total) - Number(invoice.amountPaid);
  const contact = invoice.deal.lead.contact;
  const company = invoice.deal.lead.company;

  const statusColors: Record<string, { bg: string; color: string }> = {
    DRAFT:          { bg: '#f1f5f9', color: '#64748b' },
    SENT:           { bg: '#eff6ff', color: '#3b82f6' },
    PARTIALLY_PAID: { bg: '#fffbeb', color: '#f59e0b' },
    PAID:           { bg: '#f0fdf4', color: '#22c55e' },
    OVERDUE:        { bg: '#fef2f2', color: '#ef4444' },
    CANCELLED:      { bg: '#f8fafc', color: '#94a3b8' },
  };
  const sc = statusColors[invoice.status] ?? { bg: '#f1f5f9', color: '#64748b' };

  return (
    <div
      id="invoice-print-area"
      style={{
        background: '#ffffff',
        color: '#1e293b',
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        maxWidth: '56rem',
        margin: '0 auto',
        padding: printMode ? '0' : '2rem',
        borderRadius: printMode ? '0' : '0.75rem',
        border: printMode ? 'none' : '1px solid #e2e8f0',
        boxShadow: printMode ? 'none' : '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Visual Pipeline (UI Only) ── */}
      {!printMode && invoice.status !== 'CANCELLED' && (
        <div className="print:hidden" style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: '#e2e8f0', zIndex: 0, transform: 'translateY(-50%)' }} />
            
            {[
              { id: 'DRAFT', label: 'Draft', active: true, completed: invoice.status !== 'DRAFT' },
              { id: 'SENT', label: 'Sent', active: ['SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].includes(invoice.status), completed: ['PARTIALLY_PAID', 'PAID'].includes(invoice.status) },
              { id: 'PAID', label: 'Paid', active: invoice.status === 'PAID', completed: invoice.status === 'PAID' }
            ].map((step, idx, arr) => {
              const isActive = step.active || step.completed;
              return (
                <div key={step.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fafbfc', padding: '0 1rem' }}>
                  <div style={{ 
                    width: '1.75rem', height: '1.75rem', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step.completed ? '#22c55e' : isActive ? '#3b82f6' : '#fff',
                    border: `2px solid ${step.completed ? '#22c55e' : isActive ? '#3b82f6' : '#cbd5e1'}`,
                    color: isActive || step.completed ? '#fff' : '#94a3b8',
                    fontSize: '0.75rem', fontWeight: 600
                  }}>
                    {step.completed ? '✓' : idx + 1}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isActive ? '#1e293b' : '#94a3b8', marginTop: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '2.5rem 2.5rem 2rem',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        {/* Brand — logo + name side by side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {companySettings?.logoUrl && (
              <img
                src={companySettings.logoUrl}
                alt={companySettings?.name || 'Logo'}
                style={{ maxHeight: '36px', maxWidth: '120px', objectFit: 'contain', display: 'block' }}
              />
            )}
            <div
              style={{
                fontSize: companySettings?.logoUrl ? '1.1rem' : '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #4f6ef7, #7c5bf7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {companySettings?.name || 'VyntRise'}
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
            {companySettings?.address
              ? companySettings.address.replace(/\n/g, ' · ')
              : '205 Van Buren Street, Suite 120 · Herndon, VA 20170'}
            <br />
            {companySettings?.email || 'hello@vyntrize.com'}
            {companySettings?.website ? ` · ${companySettings.website.replace(/^https?:\/\//, '')}` : ' · vyntrize.com'}
            {companySettings?.taxId && <><br />Tax ID: {companySettings.taxId}</>}
          </div>
        </div>

        {/* Invoice meta */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Invoice
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
            {invoice.number}
          </div>
          <span
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.15rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backgroundColor: sc.bg,
              color: sc.color,
            }}
          >
            {invoice.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* ── Bill To + Dates ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '2rem',
          padding: '2rem 2.5rem',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        {/* Bill To */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Bill To
          </div>
          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.15rem' }}>
            {contact.firstName} {contact.lastName}
          </div>
          {company && (
            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.15rem' }}>{company.name}</div>
          )}
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{contact.email}</div>
          {contact.phone && <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{contact.phone}</div>}
        </div>

        {/* Deal */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            For
          </div>
          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{invoice.deal.title}</div>
        </div>

        {/* Dates */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Dates
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Issued</span>
              <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 500 }}>{fmtDate(invoice.issueDate)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Due</span>
              <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 500 }}>{fmtDate(invoice.dueDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Line Items ── */}
      <div style={{ padding: '2rem 2.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
              {['Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '0 0 0.75rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    textAlign: i === 0 ? 'left' : 'right',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr key={li.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '0.875rem 0', color: '#1e293b', fontSize: '0.875rem' }}>{li.description}</td>
                <td style={{ padding: '0.875rem 0', color: '#64748b', fontSize: '0.875rem', textAlign: 'right' }}>
                  {Number(li.quantity).toLocaleString()}
                </td>
                <td style={{ padding: '0.875rem 0', color: '#64748b', fontSize: '0.875rem', textAlign: 'right' }}>
                  ${fmt(li.unitPrice)}
                </td>
                <td style={{ padding: '0.875rem 0', color: '#1e293b', fontSize: '0.875rem', fontWeight: 500, textAlign: 'right' }}>
                  ${fmt(li.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals block */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <div style={{ width: '16rem' }}>
            {[
              { label: 'Subtotal', value: `$${fmt(invoice.subtotal)}` },
              ...(invoice.discount && Number(invoice.discount) > 0
                ? [{ label: 'Discount', value: `-$${fmt(invoice.discount)}` }]
                : []),
              ...(invoice.taxRate && Number(invoice.taxRate) > 0
                ? [{ label: `Tax (${invoice.taxRate}%)`, value: `$${fmt(invoice.taxAmount ?? 0)}` }]
                : []),
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: '0.8125rem', color: '#1e293b' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0.25rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Total</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#4f6ef7' }}>{invoice.currency} {fmt(invoice.total)}</span>
            </div>
            {Number(invoice.amountPaid) > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#22c55e' }}>Amount Paid</span>
                  <span style={{ fontSize: '0.8125rem', color: '#22c55e', fontWeight: 600 }}>-${fmt(invoice.amountPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0 0', borderTop: '2px solid #f1f5f9', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Balance Due</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: remaining > 0 ? '#f59e0b' : '#22c55e' }}>
                    {invoice.currency} {fmt(remaining)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment History ── */}
      {invoice.payments.length > 0 && (
        <div style={{ padding: '0 2.5rem 2rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Payment History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {invoice.payments.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8125rem', color: '#1e293b', fontWeight: 500 }}>
                    {methodLabel[p.method] ?? p.method}
                  </span>
                  {p.reference && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>#{p.reference}</span>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{fmtDate(p.paidAt)}</div>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22c55e' }}>
                  +${fmt(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {invoice.notes && (
        <div
          style={{
            margin: '0 2.5rem 2rem',
            padding: '1rem 1.25rem',
            background: '#f8fafc',
            borderRadius: '0.5rem',
            borderLeft: '3px solid #4f6ef7',
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
            Notes & Terms
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>{invoice.notes}</p>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          padding: '1.25rem 2.5rem',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#94a3b8',
        }}
      >
        Thank you for your business · {companySettings?.name || 'VyntRise'} · {companySettings?.email || 'hello@vyntrize.com'}
      </div>
    </div>
  );
}
