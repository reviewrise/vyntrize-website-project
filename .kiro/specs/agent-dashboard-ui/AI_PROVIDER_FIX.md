# AI Provider Factory Fix

## Problem
The AI Provider Factory was failing to initialize providers with the error:
```
TypeError: getOpenAIProvider is not a function
TypeError: getGeminiProvider is not a function
```

This was causing:
- Agent Registry showing "Not Initialized"
- AI Providers showing "all_circuits_open" with no providers available
- Dashboard health status showing degraded

## Root Cause
The `AIProviderFactory` constructor was calling `this.initializeProviders()` which was changed to an async function. However, **constructors cannot be async in JavaScript/TypeScript**, so the async initialization was never completing before the constructor returned.

## Solution
Implemented the **Static Factory Method Pattern**:

### 1. Made Constructor Private
```typescript
private constructor() {
  this.defaultProvider = (process.env.AI_PROVIDER as AIProviderType) || 'auto';
}
```

### 2. Added Static Factory Method
```typescript
static async create(): Promise<AIProviderFactory> {
  const factory = new AIProviderFactory();
  await factory.initializeProviders();
  return factory;
}
```

### 3. Created Lazy Singleton Getter
```typescript
let _aiProviderFactoryInstance: AIProviderFactory | null = null;
let _initializationPromise: Promise<AIProviderFactory> | null = null;

export async function getAIProviderFactory(): Promise<AIProviderFactory> {
  if (_aiProviderFactoryInstance) {
    return _aiProviderFactoryInstance;
  }

  if (_initializationPromise) {
    return _initializationPromise;
  }

  _initializationPromise = AIProviderFactory.create().then(factory => {
    _aiProviderFactoryInstance = factory;
    return factory;
  });

  return _initializationPromise;
}
```

### 4. Updated All Consumers

**Email Generation Agent:**
```typescript
// Before
const aiProvider = getAIProvider();

// After
const aiProvider = await getAIProvider();
```

**Next Best Action Agent:**
```typescript
// Before
const aiProvider = getAIProvider();

// After
const aiProvider = await getAIProvider();
```

**Health API Route:**
```typescript
// Before
import { aiProviderFactory } from '@/lib/agents/ai-provider-factory';
const aiProviderStatus = aiProviderFactory.getAllProviderStatus();

// After
import { getAIProviderFactory } from '@/lib/agents/ai-provider-factory';
const factory = await getAIProviderFactory();
const aiProviderStatus = factory.getAllProviderStatus();
```

## Files Modified
1. `apps/vyntrize-crm/lib/agents/ai-provider-factory.ts` - Implemented static factory pattern
2. `apps/vyntrize-crm/lib/agents/email-generation-agent.ts` - Added await to getAIProvider()
3. `apps/vyntrize-crm/lib/agents/next-best-action-agent.ts` - Added await to getAIProvider()
4. `apps/vyntrize-crm/app/api/agents/health/route.ts` - Updated to use getAIProviderFactory()

## Verification
After the fix, the dev server logs show:
```
[OpenAIProvider] Initialized with model: gpt-4
[AIProviderFactory] OpenAI provider available
[GeminiProvider] Initialized with model: gemini-pro
[AIProviderFactory] Gemini provider available
[AIProviderFactory] Available providers: openai, gemini
```

The health endpoint now returns:
- Agent Registry: ✅ Initialized
- Job Queue: ✅ Healthy
- AI Providers: ✅ Both OpenAI and Gemini available

## Key Learnings
1. **Constructors cannot be async** - Use static factory methods for async initialization
2. **Lazy initialization** - Providers are only initialized when first accessed, improving startup time
3. **Singleton pattern with async** - Need to track both the instance and the initialization promise to prevent race conditions
4. **Dynamic imports** - Using `await import()` instead of `require()` for better module loading

## Environment Configuration
Both AI providers are configured in `.env`:
```env
AI_PROVIDER="auto"
OPENAI_API_KEY="sk-your-openai-api-key-here"
OPENAI_MODEL="gpt-4"
GEMINI_API_KEY="AIzaSyBnLWn4QZmqr6X00zEom_4RjQgg82sZ1Gg"
GEMINI_MODEL="gemini-pro"
```

The `auto` provider setting means the system will automatically use the first available provider (OpenAI in this case, with Gemini as fallback).
