import { getPublicInvoice } from '@/lib/actions/invoices';
import { getCompanySettings } from '@/lib/actions/company-settings';
import { notFound } from 'next/navigation';
import { InvoicePreview } from '@/components/InvoicePreview';
import { ExternalLink, Building2, CreditCard, CheckCircle } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await getPublicInvoice(id);
  return { title: inv ? `Pay Invoice ${inv.number}` : 'Invoice Not Found' };
}

export default async function PublicInvoicePaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getPublicInvoice(id);
  
  if (!invoice) {
    notFound();
  }

  const companySettings = await getCompanySettings();
  const remaining = Number(invoice.total) - Number(invoice.amountPaid);
  const isPaid = invoice.status === 'PAID';

  const serializedInvoice = {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
    taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : null,
    discount: invoice.discount ? Number(invoice.discount) : null,
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    lineItems: invoice.lineItems.map((li) => ({
      ...li,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      total: Number(li.total),
    })),
    payments: invoice.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
    deal: {
      ...invoice.deal,
      value: invoice.deal?.value ? Number(invoice.deal.value) : null,
    },
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Payment Options Header */}
        {!isPaid && (
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '1rem', 
            padding: '2rem', 
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0' 
          }}>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', color: '#1e293b' }}>Payment Options</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              
              {/* Online Payment (Stripe) */}
              {invoice.stripePaymentUrl && (
                <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600, marginBottom: '0.5rem' }}>
                      <CreditCard size={18} /> Pay Online Securley
                    </div>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#15803d', lineHeight: 1.5 }}>
                      Pay instantly using your credit card or Apple/Google Pay via Stripe.
                    </p>
                  </div>
                  <a 
                    href={invoice.stripePaymentUrl} 
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                      backgroundColor: '#22c55e', color: 'white', textDecoration: 'none', 
                      padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Pay ${remaining.toFixed(2)} Now <ExternalLink size={16} />
                  </a>
                </div>
              )}

              {/* Offline/Manual Payment Instructions */}
              {companySettings.paymentInstructions && (
                <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <Building2 size={18} /> Offline Payment
                  </div>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#64748b' }}>
                    You can also pay manually using the following instructions:
                  </p>
                  <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                    {companySettings.paymentInstructions}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Fully Paid Banner */}
        {isPaid && (
          <div style={{ 
            backgroundColor: '#f0fdf4', 
            borderRadius: '1rem', 
            padding: '2rem', 
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            color: '#166534'
          }}>
            <CheckCircle size={32} color="#22c55e" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Thank you for your payment!</h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', opacity: 0.8 }}>This invoice has been fully paid.</p>
            </div>
          </div>
        )}

        {/* Invoice Preview */}
        <div>
          <InvoicePreview 
            invoice={serializedInvoice as any} 
            companySettings={companySettings} 
            printMode={true} 
          />
        </div>
        
      </div>
    </div>
  );
}
