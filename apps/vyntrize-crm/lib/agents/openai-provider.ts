// OpenAI Provider for AI-powered agent features

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { AIProvider, AIRequest, AIResponse, AIProviderConfig } from './ai-provider-interface';

class OpenAIProvider extends AIProvider {
  private client: OpenAI;

  constructor(config?: Partial<AIProviderConfig>) {
    const fullConfig: AIProviderConfig = {
      provider: 'openai',
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY,
      model: config?.model || process.env.OPENAI_MODEL || 'gpt-4',
      maxTokensPerMinute: config?.maxTokensPerMinute || 10000,
      cacheTTL: config?.cacheTTL || 5 * 60 * 1000,
      maxConcurrent: config?.maxConcurrent || 5,
      circuitBreakerThreshold: config?.circuitBreakerThreshold || 5,
    };

    super(fullConfig);

    if (!fullConfig.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    this.client = new OpenAI({
      apiKey: fullConfig.apiKey,
      timeout: 30000,
    });

    console.log(`[OpenAIProvider] Initialized with model: ${fullConfig.model}`);
  }

  getProviderName(): string {
    return 'OpenAI';
  }

  getModelName(): string {
    return this.config.model || 'gpt-4';
  }

  /**
   * Generate completion with rate limiting and caching
   */
  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    // Check circuit breaker
    this.checkCircuitBreaker();

    // Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('[OpenAIProvider] Cache hit');
      return {
        content: cached,
        tokensUsed: 0,
        cached: true,
        provider: this.getProviderName(),
        model: this.getModelName(),
      };
    }

    // Wait for concurrency slot
    await this.waitForConcurrencySlot();

    // Wait for rate limit
    await this.waitForRateLimit(request.maxTokens || 500);

    try {
      this.currentConcurrent++;

      // Sanitize inputs
      const sanitizedPrompt = this.sanitizeInput(request.prompt);
      const sanitizedSystemPrompt = request.systemPrompt 
        ? this.sanitizeInput(request.systemPrompt)
        : 'You are a helpful CRM assistant. Provide professional, concise responses.';

      // Make API call
      const completion = await this.client.chat.completions.create({
        model: this.getModelName(),
        messages: [
          { role: 'system', content: sanitizedSystemPrompt },
          { role: 'user', content: sanitizedPrompt },
        ],
        max_tokens: request.maxTokens || 500,
        temperature: request.temperature || 0.7,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Update rate limit tracking
      this.tokenUsageThisMinute += tokensUsed;

      // Cache result
      this.setCache(cacheKey, content);

      // Track metrics
      await this.trackMetrics(tokensUsed);

      // Reset failure count on success
      this.onSuccess();

      console.log('[OpenAIProvider] Completion generated', {
        tokensUsed,
        cached: false,
      });

      return {
        content,
        tokensUsed,
        cached: false,
        provider: this.getProviderName(),
        model: this.getModelName(),
      };
    } catch (error) {
      this.onFailure();
      console.error('[OpenAIProvider] Error:', error);
      throw error;
    } finally {
      this.currentConcurrent--;
    }
  }

  /**
   * Track metrics in database
   */
  private async trackMetrics(tokensUsed: number): Promise<void> {
    try {
      await prisma.agentMetric.create({
        data: {
          agentType: 'OPENAI_PROVIDER',
          metricName: 'tokens_used',
          metricValue: tokensUsed,
          calculatedAt: new Date(),
          metadata: { model: this.getModelName() },
        },
      });
    } catch (error) {
      console.error('[OpenAIProvider] Failed to track metrics:', error);
    }
  }
}

// Lazy singleton instance - only created when accessed and API key is available
let _openAIProviderInstance: OpenAIProvider | null = null;

export function getOpenAIProvider(): OpenAIProvider {
  if (!_openAIProviderInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }
    _openAIProviderInstance = new OpenAIProvider();
  }
  return _openAIProviderInstance;
}

// For backward compatibility, export as property that throws if accessed without key
export const openAIProvider = new Proxy({} as OpenAIProvider, {
  get(target, prop) {
    return getOpenAIProvider()[prop as keyof OpenAIProvider];
  }
});
