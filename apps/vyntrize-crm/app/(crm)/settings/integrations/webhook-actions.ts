'use server';

import { getSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export async function updateWebhookSecret(secret: string) {
  const session = await getSession();
  if (!session?.isLoggedIn) {
    throw new Error('Unauthorized');
  }

  // Update in memory so it works immediately without restart
  process.env.VYNTRISE_WEBHOOK_SECRET = secret;

  // Update in .env file to persist across restarts
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('VYNTRISE_WEBHOOK_SECRET=')) {
        envContent = envContent.replace(
          /VYNTRISE_WEBHOOK_SECRET=.*/g, 
          `VYNTRISE_WEBHOOK_SECRET="${secret}"`
        );
      } else {
        envContent += `\n# ─── Vyntrise Webhook ─────────────────────────────────────────────────────────\nVYNTRISE_WEBHOOK_SECRET="${secret}"\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
    }
  } catch (error) {
    console.error('Failed to update .env file:', error);
    // Even if it fails to write to .env (e.g., read-only filesystem in prod), 
    // it will work in memory for the current process.
  }

  return { success: true };
}
