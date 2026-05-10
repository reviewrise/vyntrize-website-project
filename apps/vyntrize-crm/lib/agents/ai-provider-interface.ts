// AI Provider Interface - Abstract interface for multiple AI providers

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  cached: boolean;
  provider: string;
  model: string;
}

export interface AIProviderConfig {
  provider: 'openai' | 'gemini' | 'claude' | 'local';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokensPerMinute?: number;
  cacheTTL?: number;
  maxConcurrent?: number;
  circuitBreakerThreshold?: number;
}

export interface AIProviderStatus {
  provider: string;
  model: string;
  circuitOpen: boolean;
  failureCount: number;
  currentConcurrent: number;
  tokenUsageThisMinute: number;
  cacheSize: number;
  unavailableReason?: string;
}

/**
 * Abstract base class for AI providers
 */
export abstract class AIProvider {
  protected config: AIProviderConfig;
  protected cache: Map<string, { content: string; timestamp: number }> = new Map();
  protected cacheTTL: number;
  protected currentConcurrent = 0;
  protected maxConcurrent: number;
  protected tokenUsageThisMinute = 0;
  protected minuteResetTime = Date.now() + 60000;
  protected maxTokensPerMinute: number;
  
  // Circuit breaker
  protected failureCount = 0;
  protected circuitBreakerThreshold: number;
  protected circuitOpen = false;
  protected circuitResetTime = 0;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.cacheTTL = config.cacheTTL || 5 * 60 * 1000; // 5 minutes
    this.maxConcurrent = config.maxConcurrent || 5;
    this.maxTokensPerMinute = config.maxTokensPerMinute || 10000;
    this.circuitBreakerThreshold = config.circuitBreakerThreshold || 5;
  }

  /**
   * Generate AI completion - must be implemented by each provider
   */
  abstract generateCompletion(request: AIRequest): Promise<AIResponse>;

  /**
   * Get provider name
   */
  abstract getProviderName(): string;

  /**
   * Get model name
   */
  abstract getModelName(): string;

  /**
   * Check circuit breaker
   */
  protected checkCircuitBreaker(): void {
    if (this.circuitOpen) {
      if (Date.now() < this.circuitResetTime) {
        const waitTime = this.circuitResetTime - Date.now();
        throw new Error(
          `Circuit breaker is OPEN for ${this.getProviderName()}. Service unavailable. Retry after ${Math.ceil(waitTime / 1000)}s`
        );
      }
      // Reset circuit breaker
      this.circuitOpen = false;
      this.failureCount = 0;
    }
  }

  /**
   * Check cache
   */
  protected getFromCache(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.content;
  }

  /**
   * Set cache
   */
  protected setCache(key: string, content: string): void {
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Generate cache key
   */
  protected getCacheKey(request: AIRequest): string {
    return `${request.systemPrompt || 'default'}:${request.prompt}:${request.maxTokens || 500}:${request.temperature || 0.7}`;
  }

  /**
   * Wait for concurrency slot
   */
  protected async waitForConcurrencySlot(): Promise<void> {
    while (this.currentConcurrent >= this.maxConcurrent) {
      await this.delay(100);
    }
  }

  /**
   * Wait for rate limit
   */
  protected async waitForRateLimit(estimatedTokens: number): Promise<void> {
    // Reset counter if minute has passed
    if (Date.now() >= this.minuteResetTime) {
      this.tokenUsageThisMinute = 0;
      this.minuteResetTime = Date.now() + 60000;
    }

    // Wait if adding this request would exceed rate limit
    while (this.tokenUsageThisMinute + estimatedTokens > this.maxTokensPerMinute) {
      const waitTime = this.minuteResetTime - Date.now();
      console.warn(`[${this.getProviderName()}] Rate limit reached, waiting ${waitTime}ms`);
      await this.delay(Math.min(waitTime, 1000));
      
      if (Date.now() >= this.minuteResetTime) {
        this.tokenUsageThisMinute = 0;
        this.minuteResetTime = Date.now() + 60000;
      }
    }
  }

  /**
   * Handle success
   */
  protected onSuccess(): void {
    this.failureCount = 0;
  }

  /**
   * Handle failure
   */
  protected onFailure(): void {
    this.failureCount++;
    
    if (this.failureCount >= this.circuitBreakerThreshold) {
      this.circuitOpen = true;
      this.circuitResetTime = Date.now() + 60000; // 1 minute
      console.error(`[${this.getProviderName()}] Circuit breaker opened`);
    }
  }

  /**
   * Sanitize input to prevent prompt injection
   */
  protected sanitizeInput(input: string): string {
    return input
      .replace(/\[INST\]/gi, '')
      .replace(/\[\/INST\]/gi, '')
      .replace(/<\|im_start\|>/gi, '')
      .replace(/<\|im_end\|>/gi, '')
      .trim()
      .slice(0, 4000);
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get provider status
   */
  getStatus(): AIProviderStatus {
    return {
      provider: this.getProviderName(),
      model: this.getModelName(),
      circuitOpen: this.circuitOpen,
      failureCount: this.failureCount,
      currentConcurrent: this.currentConcurrent,
      tokenUsageThisMinute: this.tokenUsageThisMinute,
      cacheSize: this.cache.size,
    };
  }
}
