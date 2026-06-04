'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  taxId: string;
  logoUrl: string;
}

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'VyntRise LLC',
  email: 'billing@vyntrise.com',
  phone: '',
  website: 'https://vyntrise.com',
  address: '123 Business Rd., Ste 100\nCity, State 12345',
  taxId: '',
  logoUrl: '',
};

const SETTINGS_KEY = 'COMPANY_PROFILE';

/**
 * Retrieves the current company settings from the database.
 * If none exist, returns the default settings.
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });
    
    if (setting && setting.value) {
      // Merge with defaults in case of missing keys
      return { ...DEFAULT_COMPANY_SETTINGS, ...(setting.value as any) };
    }
  } catch (error) {
    console.error('Failed to fetch company settings:', error);
  }
  
  return DEFAULT_COMPANY_SETTINGS;
}

/**
 * Updates the global company settings.
 * Requires admin privileges in a real app, but we just check session here.
 */
export async function updateCompanySettings(data: CompanySettings) {
  const session = await getSession();
  if (!session.userId) {
    throw new Error('Unauthorized');
  }

  // UPSERT the setting row
  await prisma.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: {
      value: data as any,
    },
    create: {
      key: SETTINGS_KEY,
      value: data as any,
    },
  });

  revalidatePath('/settings/company');
  revalidatePath('/invoices'); // Revalidate anything that might depend on this
  
  return { success: true };
}
