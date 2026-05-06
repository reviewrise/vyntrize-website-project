// OpenAI Provider with rate limiting, caching, and circuit breaker

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpenAIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAIResponse {
  content: string;
  tokensUsed: number;
  cached: boolean;
}

// ─── OpenAI Provider ──────────────────────────────────────────────────────────

class OpenAIProvider {
  private client: OpenAI | null = null;
  private cache: Map<string, { content: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_TPM = 10000; // tokens per minute
  private readonly MAX_CONCURRENT = 5;
  private currentConcurrent = 0;
  private tokenUsageThisMinute = 0;
  private minuteResetTime = Date.now() + 60000;

  // Circuit breaker
  private failureCount = 0;
  private readonly FAILURE_THRESHOLD = 5;
  private circuitOpen = false;
  private circuitResetTime = 0;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('[OpenAIProvider] OPENAI_API_KEY not set, provider will not be functional');
      return;
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 30000, // 30 second timeout
    });

    console.log('[OpenAIProvider] Initialized');
  }

  /**
   * Generate completion with rate limiting and caching
   */
  async generateCompletion(request: OpenAIRequest): Promise<OpenAIResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.');
    }

    // Check circuit breaker
    if (this.circuitOpen) {
      if (Date.now() < this.circuitResetTime) {
        throw new Error('OpenAI circuit breaker is open. Service temporarily unavailable.');
      }
      // Reset circuit breaker
      this.circuitOpen = false;
      this.failureCount = 0;
      console.log('[OpenAIProvider] Circuit breaker reset');
    }

    // Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('[OpenAIProvider] Cache hit');
      return {
        content: cached,
        tokensUsed: 0,
        cached: true,
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
        model: 'gpt-4',
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
      this.failureCount = 0;

      console.log('[OpenAIProvider] Completion generated', {
        tokensUsed,
        cached: false,
      });

      return {
        content,
        tokensUsed,
        cached: false,
      };
    } catch (error) {
      this.failureCount++;
      
      // Open circuit breaker if threshold reached
      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        this.circuitOpen = true;
        this.circuitResetTime = Date.now() + 60000; // 1 minute
        console.error('[OpenAIProvider] Circuit breaker opened');
      }

      console.error('[OpenAIProvider] Error:', error);
      throw error;
    } finally {
      this.currentConcurrent--;
    }
  }

  /**
   * Wait for available concurrency slot
   */
  private async waitForConcurrencySlot(): Promise<void> {
    while (this.currentConcurrent >= this.MAX_CONCURRENT) {
      await this.delay(100);
    }
  }

  /**
   * Wait for rate limit availability
   */
  private async waitForRateLimit(estimatedTokens: number): Promise<void> {
    // Reset counter if minute has passed
    if (Date.now() >= this.minuteResetTime) {
      this.tokenUsageThisMinute = 0;
      this.minuteResetTime = Date.now() + 60000;
    }

    // Wait if adding this request would exceed rate limit
    while (this.tokenUsageThisMinute + estimatedTokens > this.RATE_LIMIT_TPM) {
      const waitTime = this.minuteResetTime - Date.now();
      console.warn(`[OpenAIProvider] Rate limit reached, waiting ${waitTime}ms`);
      await this.delay(Math.min(waitTime, 1000));
      
      // Check if minute has reset
      if (Date.now() >= this.minuteResetTime) {
        this.tokenUsageThisMinute = 0;
        this.minuteResetTime = Date.now() + 60000;
      }
    }
  }

  /**
   * Sanitize input to prevent prompt injection
   */
  private sanitizeInput(input: string): string {
    // Remove potential prompt injection patterns
    return input
      .replace(/\[INST\]/gi, '')
      .replace(/\[\/INST\]/gi, '')
      .replace(/<\|im_start\|>/gi, '')
      .replace(/<\|im_end\|>/gi, '')
      .trim()
      .slice(0, 4000); // Limit length
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: OpenAIRequest): string {
    return `${request.systemPrompt || 'default'}:${request.prompt}:${request.maxTokens || 500}:${request.temperature || 0.7}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.content;
  }

  /**
   * Set cache
   */
  private setCache(key: string, content: string): void {
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
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
          metadata: {},
        },
      });
    } catch (error) {
      console.error('[OpenAIProvider] Failed to track metrics:', error);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get provider status
   */
  getStatus() {
    return {
      initialized: this.client !== null,
      circuitOpen: this.circuitOpen,
      failureCount: this.failureCount,
      currentConcurrent: this.currentConcurrent,
      tokenUsageThisMinute: this.tokenUsageThisMinute,
      cacheSize: this.cache.size,
    };
  }
}

// Singleton instance
export const openAIProvider = new OpenAIProvider();
