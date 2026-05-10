# Gemini Provider "Unavailable" Display Fix

## Problem
Even though the Gemini provider was initializing successfully (as shown in server logs), the dashboard was showing it as "Unavailable" with status "Circuit: Closed".

### Server Logs Showed Success:
```
[GeminiProvider] Initialized with model: gemini-pro
[AIProviderFactory] Gemini provider available
[AIProviderFactory] Available providers: openai, gemini
```

### But Dashboard Showed:
- Status: **Unavailable** ❌
- Circuit: Closed ✅

## Root Cause
The `getAllProviderStatus()` method in `AIProviderFactory` was returning the raw provider status from `provider.getStatus()`, which includes:
- `circuitOpen`
- `failureCount`
- `provider`
- `model`
- etc.

But it was **missing the `available` field** that the frontend `HealthStatusWidget` component expects to determine if a provider is usable.

### Frontend Code (HealthStatusWidget.tsx):
```typescript
<span style={{ color: provider.available ? 'var(--color-success)' : 'var(--color-danger)' }}>
  {provider.available ? 'Available' : 'Unavailable'}
</span>
```

The widget checks `provider.available` but this field didn't exist in the API response!

## Solution
Added the `available` field to the provider status in `getAllProviderStatus()`:

### File: `apps/vyntrize-crm/lib/agents/ai-provider-factory.ts`

```typescript
getAllProviderStatus() {
  const status: Record<string, any> = {};
  
  for (const [name, provider] of this.providers.entries()) {
    const providerStatus = provider.getStatus();
    status[name] = {
      ...providerStatus,
      available: !providerStatus.circuitOpen, // Provider is available if circuit is not open
    };
  }

  return {
    defaultProvider: this.defaultProvider,
    availableProviders: this.getAvailableProviders(),
    providers: status,
  };
}
```

### Logic:
- **Circuit Closed** (circuitOpen = false) → **Available** = true ✅
- **Circuit Open** (circuitOpen = true) → **Available** = false ❌

## Verification Steps

1. **Restart the dev server** (if not using hot reload):
   ```bash
   pnpm dev:crm
   ```

2. **Hard refresh the browser** to clear cached API responses:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Check the dashboard** at `http://localhost:3014/agents`

4. **Expected Result**:
   ```
   Provider Details:
   
   ┌─────────────────────┐
   │ openai              │
   │ ✓ Available         │
   │ Circuit: Closed     │
   │ Failures: 0         │
   └─────────────────────┘
   
   ┌─────────────────────┐
   │ gemini              │
   │ ✓ Available         │
   │ Circuit: Closed     │
   │ Failures: 0         │
   └─────────────────────┘
   ```

## API Response Structure

### Before Fix:
```json
{
  "components": {
    "aiProviders": {
      "providers": {
        "gemini": {
          "provider": "Google Gemini",
          "model": "gemini-pro",
          "circuitOpen": false,
          "failureCount": 0
          // ❌ Missing "available" field
        }
      }
    }
  }
}
```

### After Fix:
```json
{
  "components": {
    "aiProviders": {
      "providers": {
        "gemini": {
          "provider": "Google Gemini",
          "model": "gemini-pro",
          "circuitOpen": false,
          "failureCount": 0,
          "available": true  // ✅ Added
        }
      }
    }
  }
}
```

## Environment Configuration
Both providers are configured in `.env` files:

```env
# AI Provider Configuration
AI_PROVIDER="auto"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key-here"
OPENAI_MODEL="gpt-4"

# Google Gemini
GEMINI_API_KEY="AIzaSyBnLWn4QZmqr6X00zEom_4RjQgg82sZ1Gg"
GEMINI_MODEL="gemini-pro"
```

## Files Modified
1. `apps/vyntrize-crm/lib/agents/ai-provider-factory.ts` - Added `available` field to provider status

## Related Issues
- This fix complements the earlier async factory initialization fix
- Both providers (OpenAI and Gemini) are now properly initialized and displayed as available
