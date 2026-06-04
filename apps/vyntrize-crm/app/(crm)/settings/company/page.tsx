import { getCompanySettings } from '@/lib/actions/company-settings';
import { CompanySettingsClient } from './CompanySettingsClient';

export default async function CompanySettingsPage() {
  const settings = await getCompanySettings();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Company Profile</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Manage your organization's legal name, address, and branding. These details will appear on invoices and email footers.
        </p>
      </div>

      <CompanySettingsClient initialData={settings} />
    </div>
  );
}
