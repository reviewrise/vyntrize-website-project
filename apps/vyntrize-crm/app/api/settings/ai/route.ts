import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAIProviderFactory } from '@/lib/agents/ai-provider-factory';

const AI_SETTINGS_KEYS = [
  'AI_OPENAI_API_KEY', 'AI_OPENAI_DEFAULT_MODEL',
  'AI_GEMINI_API_KEY', 'AI_GEMINI_DEFAULT_MODEL',
  'AI_CLAUDE_API_KEY', 'AI_CLAUDE_DEFAULT_MODEL',
  'AI_DEFAULT_PROVIDER'
];

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: AI_SETTINGS_KEYS } }
    });

    const config: Record<string, string> = {};
    for (const setting of settings) {
      // Mask API keys for security
      if (setting.key.endsWith('_API_KEY') && setting.value) {
        const val = String(setting.value);
        if (val.length > 8) {
          config[setting.key] = `${val.substring(0, 4)}...${val.substring(val.length - 4)}`;
        } else {
          config[setting.key] = '***';
        }
      } else {
        config[setting.key] = String(setting.value || '');
      }
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('[API /settings/ai] GET error:', error);
    return NextResponse.json({ error: 'Failed to load AI settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = [];

    for (const key of AI_SETTINGS_KEYS) {
      if (body[key] !== undefined) {
        // Only update API keys if they are not masked (i.e. user provided a new one)
        if (key.endsWith('_API_KEY') && body[key].includes('...')) {
          continue;
        }

        updates.push(
          prisma.systemSetting.upsert({
            where: { key },
            update: { value: body[key] },
            create: { key, value: body[key] },
          })
        );
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /settings/ai] POST error:', error);
    return NextResponse.json({ error: 'Failed to save AI settings' }, { status: 500 });
  }
}
