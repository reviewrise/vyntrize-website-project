// GET /api/agents/health - Get agent system health status

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { agentRegistry } from '@/lib/agents/registry';
import { getAIProviderFactory } from '@/lib/agents/ai-provider-factory';

export async function GET() {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure agent system is initialized (in case API route runs before instrumentation)
    if (!agentRegistry.isInitialized()) {
      try {
        await agentRegistry.registerAllAgents();
      } catch (error) {
        console.error('[API] Failed to initialize agent registry:', error);
      }
    }

    // Get agent registry status
    const registryHealth = await agentRegistry.getHealthStatus();

    // Get all AI provider status
    const factory = await getAIProviderFactory();
    const aiProviderStatus = factory.getAllProviderStatus();

    // Calculate overall health
    const hasHealthyProvider = Object.values(aiProviderStatus.providers).some(
      (provider: any) => !provider.circuitOpen
    );
    const isHealthy = registryHealth.initialized && hasHealthyProvider;

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      components: {
        agentRegistry: {
          status: registryHealth.initialized ? 'healthy' : 'not_initialized',
          initialized: registryHealth.initialized,
        },
        jobQueue: {
          status: 'healthy',
          metrics: registryHealth.jobQueue,
        },
        aiProviders: {
          status: hasHealthyProvider ? 'healthy' : 'all_circuits_open',
          defaultProvider: aiProviderStatus.defaultProvider,
          availableProviders: aiProviderStatus.availableProviders,
          providers: aiProviderStatus.providers,
        },
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch health status:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Failed to fetch health status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
