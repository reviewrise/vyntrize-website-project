import { getInvoice } from '@/lib/actions/invoices';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InvoicePreview } from '@/components/InvoicePreview';
import { InvoiceDetailClient } from './InvoiceDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await getInvoice(id);
  return { title: inv ? `${inv.number} — VyntRise CRM` : 'Invoice Not Found' };
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const remaining = Number(invoice.total) - Number(invoice.amountPaid);

  const serializedInvoice = {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
    taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : null,
    discount: invoice.discount ? Number(invoice.discount) : null,
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    // Stripe integration fields
    stripeInvoiceId: invoice.stripeInvoiceId ?? null,
    stripePaymentUrl: invoice.stripePaymentUrl ?? null,
    stripeStatus: invoice.stripeStatus ?? null,
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
    <div style={{ padding: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <Link
          href={`/deals/${invoice.dealId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Back to Deal
        </Link>
        {/* Actions */}
        <InvoiceDetailClient invoice={serializedInvoice} remaining={remaining} />
      </div>

      {/* Invoice preview */}
      <InvoicePreview invoice={serializedInvoice} />
    </div>
  );
}
