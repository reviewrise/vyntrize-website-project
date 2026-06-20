'use server';

import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateSmsConfig(apiKey: string) {
  const session = await getSession();
  if (!session?.isLoggedIn) {
    throw new Error('Unauthorized');
  }

  // The base URL can be hardcoded or passed in. We'll stick to the default unless env var overrides.
  const baseUrl = process.env.VYNTRIZE_SMS_BASE_URL ?? 'https://sms.vyntrise.com';

  if (!apiKey.trim()) {
    // Delete the configuration
    await prisma.systemSetting.deleteMany({
      where: { key: 'SMS_CONFIG' },
    });
  } else {
    // Upsert the configuration
    await prisma.systemSetting.upsert({
      where: { key: 'SMS_CONFIG' },
      update: {
        value: { apiKey: apiKey.trim(), baseUrl } as any,
      },
      create: {
        key: 'SMS_CONFIG',
        value: { apiKey: apiKey.trim(), baseUrl } as any,
      },
    });
  }

  revalidatePath('/settings/integrations');
}
