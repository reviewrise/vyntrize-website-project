// Google Gemini Provider for AI-powered agent features

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { AIProvider, AIRequest, AIResponse, AIProviderConfig } from './ai-provider-interface';

class GeminiProvider extends AIProvider {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor(config?: Partial<AIProviderConfig>) {
    const fullConfig: AIProviderConfig = {
      provider: 'gemini',
      apiKey: config?.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      model: config?.model || process.env.GEMINI_MODEL || 'gemini-pro',
      maxTokensPerMinute: config?.maxTokensPerMinute || 15000,
      cacheTTL: config?.cacheTTL || 5 * 60 * 1000,
      maxConcurrent: config?.maxConcurrent || 5,
      circuitBreakerThreshold: config?.circuitBreakerThreshold || 5,
    };

    super(fullConfig);

    if (!fullConfig.apiKey) {
      throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable not set');
    }

    this.client = new GoogleGenerativeAI(fullConfig.apiKey);
    this.model = this.client.getGenerativeModel({ model: fullConfig.model! });

    console.log(`[GeminiProvider] Initialized with model: ${fullConfig.model}`);
  }

  getProviderName(): string {
    return 'Google Gemini';
  }

  getModelName(): string {
    return this.config.model || 'gemini-pro';
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
      console.log('[GeminiProvider] Cache hit');
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

      // Combine system prompt and user prompt for Gemini
      const fullPrompt = `${sanitizedSystemPrompt}\n\n${sanitizedPrompt}`;

      // Make API call
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 500,
          temperature: request.temperature || 0.7,
        },
      });

      const response = await result.response;
      const content = response.text() || '';
      
      // Gemini doesn't provide token usage in the same way, estimate it
      const tokensUsed = Math.ceil((fullPrompt.length + content.length) / 4);

      // Update rate limit tracking
      this.tokenUsageThisMinute += tokensUsed;

      // Cache result
      this.setCache(cacheKey, content);

      // Track metrics
      await this.trackMetrics(tokensUsed);

      // Reset failure count on success
      this.onSuccess();

      console.log('[GeminiProvider] Completion generated', {
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
      console.error('[GeminiProvider] Error:', error);
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
          agentType: 'OPENAI_PROVIDER', // Reuse same enum value
          metricName: 'tokens_used',
          metricValue: tokensUsed,
          calculatedAt: new Date(),
          metadata: { 
            provider: 'gemini',
            model: this.getModelName(),
          },
        },
      });
    } catch (error) {
      console.error('[GeminiProvider] Failed to track metrics:', error);
    }
  }
}

// Lazy singleton instance - only created when accessed and API key is available
let _geminiProviderInstance: GeminiProvider | null = null;

export function getGeminiProvider(): GeminiProvider {
  if (!_geminiProviderInstance) {
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable not set');
    }
    _geminiProviderInstance = new GeminiProvider();
  }
  return _geminiProviderInstance;
}

// For backward compatibility, export as property that throws if accessed without key
export const geminiProvider = new Proxy({} as GeminiProvider, {
  get(target, prop) {
    return getGeminiProvider()[prop as keyof GeminiProvider];
  }
});
