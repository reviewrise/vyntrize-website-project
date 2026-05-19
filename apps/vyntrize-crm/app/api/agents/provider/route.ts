import { NextRequest, NextResponse } from 'next/server';
import { getAIProviderFactory } from '@/lib/agents/ai-provider-factory';
import type { AIProviderType } from '@/lib/agents/ai-provider-factory';

// GET /api/agents/provider — returns live status for all configured providers
export async function GET() {
  try {
    const factory = await getAIProviderFactory();
    const status = factory.getAllProviderStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[API /agents/provider] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load provider status' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/provider — switch the active provider for this runtime
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body as { provider: AIProviderType };

    const validProviders: AIProviderType[] = ['openai', 'gemini', 'auto'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    const factory = await getAIProviderFactory();
    factory.setDefaultProviderType(provider);

    const status = factory.getAllProviderStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error: any) {
    console.error('[API /agents/provider] PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to switch provider' },
      { status: 400 }
    );
  }
}
