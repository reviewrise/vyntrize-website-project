'use client';

import { useState, useTransition } from 'react';
import { CompanySettings, updateCompanySettings } from '@/lib/actions/company-settings';
import { Building2, Mail, Phone, Link2, MapPin, Receipt, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function CompanySettingsClient({ initialData }: { initialData: CompanySettings }) {
  const [data, setData] = useState<CompanySettings>(initialData);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        await updateCompanySettings(data);
        setMessage({ type: 'success', text: 'Company profile saved successfully!' });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
      }
    });
  };

  const update = (field: keyof CompanySettings, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const inputClasses = "w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all";
  const inputStyle = {
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
  };

  return (
    <form onSubmit={handleSave} className="rounded-2xl p-6 space-y-6 shadow-sm" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
      
      {/* Name */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
          <Building2 className="h-3.5 w-3.5" /> Company / Legal Name
        </label>
        <input
          required
          type="text"
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. Acme Corp LLC"
          className={inputClasses}
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            <Mail className="h-3.5 w-3.5" /> Billing/Support Email
          </label>
          <input
            required
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="billing@example.com"
            className={inputClasses}
            style={inputStyle}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            <Phone className="h-3.5 w-3.5" /> Phone Number (Optional)
          </label>
          <input
            type="text"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={inputClasses}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Website */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            <Link2 className="h-3.5 w-3.5" /> Website URL
          </label>
          <input
            type="url"
            value={data.website}
            onChange={(e) => update('website', e.target.value)}
            placeholder="https://example.com"
            className={inputClasses}
            style={inputStyle}
          />
        </div>

        {/* Tax ID */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            <Receipt className="h-3.5 w-3.5" /> Tax ID / VAT Number
          </label>
          <input
            type="text"
            value={data.taxId}
            onChange={(e) => update('taxId', e.target.value)}
            placeholder="e.g. US123456789"
            className={inputClasses}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
          <MapPin className="h-3.5 w-3.5" /> Physical Address
        </label>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          This address will be displayed on all generated invoices.
        </p>
        <textarea
          required
          rows={3}
          value={data.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder="123 Business Rd., Ste 100&#10;City, State 12345&#10;Country"
          className={inputClasses}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Payment Instructions */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
          <Receipt className="h-3.5 w-3.5" /> Payment Instructions (Offline / Bank Details)
        </label>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          These instructions will be shown on the public invoice page for clients who want to pay manually.
        </p>
        <textarea
          rows={4}
          value={data.paymentInstructions || ''}
          onChange={(e) => update('paymentInstructions', e.target.value)}
          placeholder="Bank Name: Example Bank&#10;Account Name: VyntRise LLC&#10;Account Number: 123456789&#10;Routing Number: 987654321"
          className={inputClasses}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Logo */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
          <ImageIcon className="h-3.5 w-3.5" /> Logo URL (Optional)
        </label>
        <input
          type="url"
          value={data.logoUrl}
          onChange={(e) => update('logoUrl', e.target.value)}
          placeholder="https://example.com/logo.png"
          className={inputClasses}
          style={inputStyle}
        />
      </div>

      {/* Message */}
      {message && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: message.type === 'success' ? 'rgb(240 253 244)' : 'rgb(254 242 242)',
            border: `1px solid ${message.type === 'success' ? 'rgb(187 247 208)' : 'rgb(254 202 202)'}`,
            color: message.type === 'success' ? 'rgb(22 101 52)' : 'rgb(153 27 27)',
          }}
        >
          {message.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />
          }
          {message.text}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: 'var(--color-primary)' }}
          onMouseEnter={(e) => !isPending && (e.currentTarget.style.backgroundColor = 'var(--color-primary-h)')}
          onMouseLeave={(e) => !isPending && (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? 'Saving...' : 'Save Company Profile'}
        </button>
      </div>
    </form>
  );
}
