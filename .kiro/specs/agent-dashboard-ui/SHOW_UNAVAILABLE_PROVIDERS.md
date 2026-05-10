# Show Unavailable Providers in Dashboard

## Requirement
Show all configured AI providers in the dashboard, even if they have placeholder API keys. Mark them as "Unavailable" with a clear reason instead of hiding them completely.

## Benefits
1. **Better visibility**: Users can see what providers are configured
2. **Clear feedback**: Shows why a provider is unavailable (e.g., "Placeholder API key")
3. **Easier troubleshooting**: Users know what needs to be fixed
4. **Configuration awareness**: Shows the full AI provider setup at a glance

## Implementation

### 1. Create Stub Providers for Placeholders
When a placeholder API key is detected, create a stub provider that:
- Returns proper status information
- Marks circuit as "open" (unavailable)
- Includes an `unavailableReason` field
- Throws an error if someone tries to use it

```typescript
private createUnavailableProvider(name: string, model: string, reason: string): any {
  return {
    getProviderName: () => name,
    getModelName: () => model,
    getStatus: () => ({
      provider: name,
      model: model,
      circuitOpen: true, // Mark as unavailable
      failureCount: 0,
      currentConcurrent: 0,
      tokenUsageThisMinute: 0,
      cacheSize: 0,
      unavailableReason: reason, // Why it's unavailable
    }),
    generateCompletion: async () => {
      throw new Error(`${name} is not available: ${reason}`);
    },
  };
}
```

### 2. Updated Initialization Logic
```typescript
// OpenAI
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey) {
  if (this.isPlaceholderKey(openaiKey)) {
    console.log('[AIProviderFactory] OpenAI API key is a placeholder - provider will be listed as unavailable');
    this.providers.set('openai', this.createUnavailableProvider('OpenAI', 'gpt-4', 'Placeholder API key'));
  } else {
    // Initialize real provider
  }
}
```

### 3. Enhanced Status Response
```typescript
getAllProviderStatus() {
  const status: Record<string, any> = {};
  
  for (const [name, provider] of this.providers.entries()) {
    const providerStatus = provider.getStatus();
    status[name] = {
      ...providerStatus,
      available: !providerStatus.circuitOpen,
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
```

### 4. Frontend Display
Updated `HealthStatusWidget.tsx` to show the unavailable reason:

```tsx
{provider.unavailableReason && (
  <div className="text-xs mt-1 p-1.5 rounded" 
       style={{ 
         backgroundColor: 'var(--color-warning-bg)', 
         color: 'var(--color-warning)' 
       }}>
    {provider.unavailableReason}
  </div>
)}
```

## Dashboard Display

### With Placeholder Keys:
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
│ ✓ Available                 │
│ Circuit: Closed             │
│ Failures: 0                 │
└─────────────────────────────┘
```

### After Adding Real OpenAI Key:
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

### Current Output:
```
[AIProviderFactory] OpenAI API key is a placeholder - provider will be listed as unavailable
[GeminiProvider] Initialized with model: gemini-pro
[AIProviderFactory] Gemini provider available
[AIProviderFactory] Configured providers: openai, gemini
```

## API Response Structure

```json
{
  "components": {
    "aiProviders": {
      "status": "degraded",
      "defaultProvider": "auto",
      "availableProviders": ["gemini"],
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
          "circuitOpen": false,
          "failureCount": 0,
          "available": true,
          "unavailableReason": null
        }
      }
    }
  }
}
```

## Key Points

1. **Configured vs Available**: 
   - `providers` object shows ALL configured providers
   - `availableProviders` array shows only working providers

2. **Circuit Breaker Logic**:
   - Placeholder providers have `circuitOpen: true`
   - This prevents them from being used
   - But they're still visible in the dashboard

3. **Error Handling**:
   - If code tries to use an unavailable provider, it throws a clear error
   - The error message includes the reason (e.g., "Placeholder API key")

4. **User Experience**:
   - Users see what's configured
   - Clear indication of what's working vs what needs attention
   - Helpful messages guide them to fix issues

## Files Modified
1. `apps/vyntrize-crm/lib/agents/ai-provider-factory.ts` - Added stub provider creation
2. `apps/vyntrize-crm/app/(crm)/agents/components/HealthStatusWidget.tsx` - Display unavailable reason
3. `apps/vyntrize-crm/types/agent-dashboard.ts` - Added unavailableReason field

## Testing
1. **With placeholder keys**: Both providers show, OpenAI marked as unavailable
2. **With real keys**: Both providers show as available
3. **With no keys**: No providers show (empty state)
4. **Mixed scenario**: Some available, some unavailable (current state)
