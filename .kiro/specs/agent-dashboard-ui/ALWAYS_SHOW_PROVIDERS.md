# Always Show AI Providers in Dashboard

## Requirement
Always show both OpenAI and Gemini providers in the dashboard, regardless of whether API keys are configured. This provides complete visibility into the AI provider setup.

## Implementation
Both providers are now **always initialized** with one of these states:

### Provider States

1. **✅ Available** - Real API key configured and working
   ```
   Status: Available
   Circuit: Closed
   ```

2. **❌ Unavailable: API key not configured** - No key in .env
   ```
   Status: Unavailable
   Reason: API key not configured
   Circuit: Open
   ```

3. **❌ Unavailable: Placeholder API key** - Placeholder value in .env
   ```
   Status: Unavailable
   Reason: Placeholder API key
   Circuit: Open
   ```

4. **❌ Unavailable: Initialization failed** - Key exists but provider failed to load
   ```
   Status: Unavailable
   Reason: Initialization failed
   Circuit: Open
   ```

## Code Changes

### Updated Initialization Logic
```typescript
// OpenAI - always show, even if not configured
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.log('[AIProviderFactory] OpenAI API key not configured - provider will be listed as unavailable');
  this.providers.set('openai', this.createUnavailableProvider('OpenAI', 'gpt-4', 'API key not configured'));
} else if (this.isPlaceholderKey(openaiKey)) {
  console.log('[AIProviderFactory] OpenAI API key is a placeholder - provider will be listed as unavailable');
  this.providers.set('openai', this.createUnavailableProvider('OpenAI', 'gpt-4', 'Placeholder API key'));
} else {
  try {
    const { getOpenAIProvider } = await import('./openai-provider');
    this.providers.set('openai', getOpenAIProvider());
    console.log('[AIProviderFactory] OpenAI provider available');
  } catch (error) {
    console.warn('[AIProviderFactory] Failed to initialize OpenAI:', error);
    this.providers.set('openai', this.createUnavailableProvider('OpenAI', 'gpt-4', 'Initialization failed'));
  }
}

// Same logic for Gemini...
```

### Enhanced Logging
```typescript
const available = Array.from(this.providers.keys());
const actuallyAvailable = available.filter(name => {
  const provider = this.providers.get(name);
  return provider && !provider.getStatus().circuitOpen;
});

console.log(`[AIProviderFactory] Configured providers: ${available.join(', ')}`);
console.log(`[AIProviderFactory] Available providers: ${actuallyAvailable.join(', ') || 'none'}`);
```

## Dashboard Display Examples

### Scenario 1: No Keys Configured
```
Provider Details:

┌─────────────────────────────┐
│ openai                      │
│ ✗ Unavailable               │
│ ⚠️ API key not configured   │
│ Circuit: Open               │
│ Failures: 0                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ gemini                      │
│ ✗ Unavailable               │
│ ⚠️ API key not configured   │
│ Circuit: Open               │
│ Failures: 0                 │
└─────────────────────────────┘
```

### Scenario 2: Placeholder Keys
```
Provider Details:

┌─────────────────────────────┐
│ openai                      │
│ ✗ Unavailable               │
│ ⚠️ Placeholder API key      │
│ Circuit: Open               │
│ Failures: 0                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ gemini                      │
│ ✗ Unavailable               │
│ ⚠️ Placeholder API key      │
│ Circuit: Open               │
│ Failures: 0                 │
└─────────────────────────────┘
```

### Scenario 3: Mixed Configuration (Current)
```
Provider Details:

┌─────────────────────────────┐
│ openai                      │
│ ✗ Unavailable               │
│ ⚠️ Placeholder API key      │
│ Circuit: Open               │
│ Failures: 0                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ gemini                      │
│ ✗ Unavailable               │
│ ⚠️ API key not configured   │
│ Circuit: Open               │
│ Failures: 0                 │
└─────────────────────────────┘
```

### Scenario 4: Both Working
```
Provider Details:

┌─────────────────────────────┐
│ openai                      │
│ ✓ Available                 │
│ Circuit: Closed             │
│ Failures: 0                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ gemini                      │
│ ✓ Available                 │
│ Circuit: Closed             │
│ Failures: 0                 │
└─────────────────────────────┘
```

## Server Logs

### Current State (OpenAI placeholder, Gemini deleted):
```
[AIProviderFactory] OpenAI API key is a placeholder - provider will be listed as unavailable
[AIProviderFactory] Gemini API key not configured - provider will be listed as unavailable
[AIProviderFactory] Configured providers: openai, gemini
[AIProviderFactory] Available providers: none
[AIProviderFactory] No AI providers available. AI features will be disabled.
```

### With Both Keys Configured:
```
[OpenAIProvider] Initialized with model: gpt-4
[AIProviderFactory] OpenAI provider available
[GeminiProvider] Initialized with model: gemini-pro
[AIProviderFactory] Gemini provider available
[AIProviderFactory] Configured providers: openai, gemini
[AIProviderFactory] Available providers: openai, gemini
```

## Benefits

1. **Complete Visibility**: Always see what providers are supported
2. **Clear Status**: Know exactly what's configured vs what's working
3. **Easy Troubleshooting**: Obvious what needs to be fixed
4. **Configuration Guidance**: Users know which providers they can configure
5. **No Surprises**: Providers don't disappear when keys are removed

## API Response Structure

```json
{
  "components": {
    "aiProviders": {
      "status": "all_circuits_open",
      "defaultProvider": "auto",
      "availableProviders": [],
      "providers": {
        "openai": {
          "provider": "OpenAI",
          "model": "gpt-4",
          "circuitOpen": true,
          "failureCount": 0,
          "available": false,
          "unavailableReason": "Placeholder API key"
        },
        "gemini": {
          "provider": "Google Gemini",
          "model": "gemini-pro",
          "circuitOpen": true,
          "failureCount": 0,
          "available": false,
          "unavailableReason": "API key not configured"
        }
      }
    }
  }
}
```

## Key Points

1. **Always 2 Providers**: OpenAI and Gemini are always shown
2. **Configured vs Available**: 
   - `providers` object always has both
   - `availableProviders` array only includes working ones
3. **Clear Reasons**: Each unavailable provider shows why
4. **Consistent UX**: Dashboard layout stays the same regardless of configuration

## Configuration Guide

### To Enable OpenAI:
1. Get API key from: https://platform.openai.com/api-keys
2. Update `.env` and `apps/vyntrize-crm/.env`:
   ```env
   OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxx"
   ```
3. Restart dev server
4. Refresh dashboard

### To Enable Gemini:
1. Get API key from: https://makersuite.google.com/app/apikey
2. Update `.env` and `apps/vyntrize-crm/.env`:
   ```env
   GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxxxxxxx"
   ```
3. Restart dev server
4. Refresh dashboard

## Files Modified
1. `apps/vyntrize-crm/lib/agents/ai-provider-factory.ts` - Always initialize both providers

## Testing Scenarios
- ✅ No keys configured → Both show as unavailable
- ✅ Placeholder keys → Both show as unavailable with "Placeholder" reason
- ✅ One real key → One available, one unavailable
- ✅ Both real keys → Both available
- ✅ Delete a key → Provider stays visible, marked as unavailable
