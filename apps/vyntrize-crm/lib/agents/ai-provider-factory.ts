// AI Provider Factory - Creates and manages AI providers

import { AIProvider, AIProviderConfig } from './ai-provider-interface';

export type AIProviderType = 'openai' | 'gemini' | 'claude' | 'auto';

class AIProviderFactory {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: AIProviderType;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // Determine default provider from environment
    this.defaultProvider = (process.env.AI_PROVIDER as AIProviderType) || 'auto';
  }

  /**
   * Static factory method to create and initialize the factory
   */
  static async create(): Promise<AIProviderFactory> {
    const factory = new AIProviderFactory();
    await factory.initializeProviders();
    return factory;
  }

  /**
   * Initialize available providers based on environment variables
   */
  private async initializeProviders(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      // Fetch DB settings
      const { prisma } = await import('@/lib/prisma');
      const settingsKeys = [
        'AI_OPENAI_API_KEY', 'AI_OPENAI_DEFAULT_MODEL',
        'AI_GEMINI_API_KEY', 'AI_GEMINI_DEFAULT_MODEL',
        'AI_CLAUDE_API_KEY', 'AI_CLAUDE_DEFAULT_MODEL',
        'AI_DEFAULT_PROVIDER'
      ];
      
      let dbSettings: Record<string, string> = {};
      try {
        const dbRows = await prisma.systemSetting.findMany({
          where: { key: { in: settingsKeys } }
        });
        dbSettings = dbRows.reduce((acc: any, row: any) => {
          acc[row.key] = row.value;
          return acc;
        }, {});
      } catch (e) {
        console.warn('[AIProviderFactory] Could not fetch settings from DB', e);
      }

      // Update default provider if set in DB
      if (dbSettings.AI_DEFAULT_PROVIDER && ['openai', 'gemini', 'claude', 'auto'].includes(dbSettings.AI_DEFAULT_PROVIDER)) {
        this.defaultProvider = dbSettings.AI_DEFAULT_PROVIDER as AIProviderType;
      }

      // OpenAI - always show, even if not configured
      const openaiKey = dbSettings.AI_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      const openaiModel = dbSettings.AI_OPENAI_DEFAULT_MODEL || process.env.OPENAI_MODEL || 'gpt-4';
      
      if (!openaiKey) {
        console.log('[AIProviderFactory] OpenAI API key not configured - provider will be listed as unavailable');
        this.providers.set('openai', this.createUnavailableProvider('OpenAI', openaiModel, 'API key not configured'));
      } else if (this.isPlaceholderKey(openaiKey)) {
        console.log('[AIProviderFactory] OpenAI API key is a placeholder - provider will be listed as unavailable');
        this.providers.set('openai', this.createUnavailableProvider('OpenAI', openaiModel, 'Placeholder API key'));
      } else {
        try {
          const { getOpenAIProvider } = await import('./openai-provider');
          this.providers.set('openai', getOpenAIProvider({ apiKey: openaiKey, model: openaiModel }));
          console.log('[AIProviderFactory] OpenAI provider available');
        } catch (error) {
          console.warn('[AIProviderFactory] Failed to initialize OpenAI:', error);
          this.providers.set('openai', this.createUnavailableProvider('OpenAI', openaiModel, 'Initialization failed'));
        }
      }

      // Google Gemini - always show, even if not configured
      const geminiKey = dbSettings.AI_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const geminiModel = dbSettings.AI_GEMINI_DEFAULT_MODEL || process.env.GEMINI_MODEL || 'gemini-pro';

      if (!geminiKey) {
        console.log('[AIProviderFactory] Gemini API key not configured - provider will be listed as unavailable');
        this.providers.set('gemini', this.createUnavailableProvider('Google Gemini', geminiModel, 'API key not configured'));
      } else if (this.isPlaceholderKey(geminiKey)) {
        console.log('[AIProviderFactory] Gemini API key is a placeholder - provider will be listed as unavailable');
        this.providers.set('gemini', this.createUnavailableProvider('Google Gemini', geminiModel, 'Placeholder API key'));
      } else {
        try {
          const { getGeminiProvider } = await import('./gemini-provider');
          this.providers.set('gemini', getGeminiProvider({ apiKey: geminiKey, model: geminiModel }));
          console.log('[AIProviderFactory] Gemini provider available');
        } catch (error) {
          console.warn('[AIProviderFactory] Failed to initialize Gemini:', error);
          this.providers.set('gemini', this.createUnavailableProvider('Google Gemini', geminiModel, 'Initialization failed'));
        }
      }

      // Log available providers
      const available = Array.from(this.providers.keys());
      const actuallyAvailable = available.filter(name => {
        const provider = this.providers.get(name);
        return provider && !provider.getStatus().circuitOpen;
      });
      
      console.log(`[AIProviderFactory] Configured providers: ${available.join(', ')}`);
      console.log(`[AIProviderFactory] Available providers: ${actuallyAvailable.join(', ') || 'none'}`);
      
      if (actuallyAvailable.length === 0) {
        console.warn('[AIProviderFactory] No AI providers available. AI features will be disabled.');
      }
    })();

    return this.initPromise;
  }

  /**
   * Create a stub provider for unavailable/misconfigured providers
   */
  private createUnavailableProvider(name: string, model: string, reason: string): any {
    return {
      getProviderName: () => name,
      getModelName: () => model,
      getStatus: () => ({
        provider: name,
        model: model,
        circuitOpen: true, // Mark as circuit open to indicate unavailable
        failureCount: 0,
        currentConcurrent: 0,
        tokenUsageThisMinute: 0,
        cacheSize: 0,
        unavailableReason: reason,
      }),
      generateCompletion: async () => {
        throw new Error(`${name} is not available: ${reason}`);
      },
    };
  }

  /**
   * Check if an API key is a placeholder value
   */
  private isPlaceholderKey(key: string): boolean {
    const placeholders = [
      'your-api-key',
      'your-key-here',
      'sk-your-openai-api-key-here',
      'replace-with-your-key',
      'add-your-key-here',
      'your_api_key_here',
    ];
    
    const lowerKey = key.toLowerCase();
    return placeholders.some(placeholder => lowerKey.includes(placeholder));
  }

  /**
   * Get AI provider instance
   */
  getProvider(providerType?: AIProviderType): AIProvider {
    const type = providerType || this.defaultProvider;

    // Auto-select first available provider
    if (type === 'auto') {
      // Find first provider that is actually available (not a placeholder/unavailable)
      for (const [name, provider] of this.providers.entries()) {
        const status = provider.getStatus();
        // Check if circuit is not open AND no unavailable reason (provider is available)
        if (!status.circuitOpen && !status.unavailableReason) {
          console.log(`[AIProviderFactory] Auto-selected ${name} provider`);
          return provider;
        }
      }
      
      // Log why providers are unavailable
      console.error('[AIProviderFactory] No providers available:');
      for (const [name, provider] of this.providers.entries()) {
        const status = provider.getStatus();
        console.error(`  - ${name}: circuitOpen=${status.circuitOpen}, reason=${status.unavailableReason || 'none'}`);
      }
      
      throw new Error('No AI providers available. Please configure at least one provider (OpenAI or Gemini).');
    }

    // Get specific provider
    const provider = this.providers.get(type);
    if (!provider) {
      // Fallback to any available provider
      for (const [name, fallbackProvider] of this.providers.entries()) {
        const status = fallbackProvider.getStatus();
        if (!status.circuitOpen && !status.unavailableReason) {
          console.log(`[AIProviderFactory] Provider ${type} not found, falling back to ${name}`);
          return fallbackProvider;
        }
      }
      throw new Error(`Provider ${type} not found and no fallback available`);
    }

    // Check if the requested provider is available
    const status = provider.getStatus();
    if (status.unavailableReason) {
      throw new Error(`Provider ${type} is not available: ${status.unavailableReason}`);
    }

    return provider;
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(providerType: AIProviderType): boolean {
    if (providerType === 'auto') {
      return this.providers.size > 0;
    }
    return this.providers.has(providerType);
  }

  /**
   * Get all available providers (only those that are actually usable)
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => {
        const status = provider.getStatus();
        return !status.circuitOpen && !status.unavailableReason;
      })
      .map(([name, _]) => name);
  }

  /**
   * Get status of all providers
   */
  getAllProviderStatus() {
    const status: Record<string, any> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      const providerStatus = provider.getStatus();
      status[name] = {
        ...providerStatus,
        available: !providerStatus.circuitOpen, // Provider is available if circuit is not open
        unavailableReason: providerStatus.unavailableReason || null,
      };
    }

    return {
      defaultProvider: this.defaultProvider,
      availableProviders: this.getAvailableProviders().filter(name => {
        const provider = this.providers.get(name);
        return provider && !provider.getStatus().circuitOpen;
      }),
      providers: status,
    };
  }

  /**
   * Get the default provider type
   */
  getDefaultProviderType(): AIProviderType {
    return this.defaultProvider;
  }

  /**
   * Set the default provider type
   */
  setDefaultProviderType(providerType: AIProviderType): void {
    if (providerType !== 'auto' && !this.isProviderAvailable(providerType)) {
      throw new Error(`Cannot set default provider to "${providerType}" - provider not available`);
    }
    this.defaultProvider = providerType;
    console.log(`[AIProviderFactory] Default provider set to: ${providerType}`);
  }
}

// Singleton instance - initialized lazily
let _aiProviderFactoryInstance: AIProviderFactory | null = null;
let _initializationPromise: Promise<AIProviderFactory> | null = null;
let _lastInitTime = 0;

/**
 * Get or create the singleton AIProviderFactory instance
 * Automatically reloads configuration from the DB every 60 seconds.
 */
export async function getAIProviderFactory(forceReload = false): Promise<AIProviderFactory> {
  const now = Date.now();
  
  if (forceReload || (now - _lastInitTime > 60000)) {
    _initializationPromise = null;
  }

  if (_aiProviderFactoryInstance && _initializationPromise !== null) {
    return _aiProviderFactoryInstance;
  }

  if (_initializationPromise) {
    return _initializationPromise;
  }

  _initializationPromise = AIProviderFactory.create().then(factory => {
    _aiProviderFactoryInstance = factory;
    _lastInitTime = Date.now();
    return factory;
  });

  return _initializationPromise;
}

/**
 * Convenience function to get the default AI provider
 */
export async function getAIProvider(providerType?: AIProviderType): Promise<AIProvider> {
  const factory = await getAIProviderFactory();
  return factory.getProvider(providerType);
}
