import { getInvoice } from '@/lib/actions/invoices';
import { getCompanySettings } from '@/lib/actions/company-settings';
import { notFound } from 'next/navigation';
import { InvoicePreview } from '@/components/InvoicePreview';

export const metadata = { title: 'Print Invoice' };

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const companySettings = await getCompanySettings();

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
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <InvoicePreview invoice={serializedInvoice} printMode={true} companySettings={companySettings} />
      <script dangerouslySetInnerHTML={{ __html: `window.onload = () => window.print();` }} />
    </div>
  );
}
