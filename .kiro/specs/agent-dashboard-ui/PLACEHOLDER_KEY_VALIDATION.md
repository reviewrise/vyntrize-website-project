# Placeholder API Key Validation Fix

## Problem
OpenAI was showing as "Available" in the dashboard even though the API key was a placeholder value `"sk-your-openai-api-key-here"` instead of a real API key.

### Root Cause
The AI Provider Factory was only checking if the environment variable exists (not empty):
```typescript
if (process.env.OPENAI_API_KEY) {
  // Initialize provider
}
```

This check passes for placeholder values like:
- `"sk-your-openai-api-key-here"`
- `"your-api-key"`
- `"add-your-key-here"`

## Solution
Added a `isPlaceholderKey()` method to detect and skip placeholder API keys during initialization.

### File: `apps/vyntrize-crm/lib/agents/ai-provider-factory.ts`

```typescript
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
```

### Updated Initialization Logic

```typescript
// OpenAI
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey && !this.isPlaceholderKey(openaiKey)) {
  try {
    const { getOpenAIProvider } = await import('./openai-provider');
    this.providers.set('openai', getOpenAIProvider());
    console.log('[AIProviderFactory] OpenAI provider available');
  } catch (error) {
    console.warn('[AIProviderFactory] Failed to initialize OpenAI:', error);
  }
} else if (openaiKey && this.isPlaceholderKey(openaiKey)) {
  console.log('[AIProviderFactory] OpenAI API key is a placeholder, skipping initialization');
}

// Google Gemini
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (geminiKey && !this.isPlaceholderKey(geminiKey)) {
  try {
    const { getGeminiProvider } = await import('./gemini-provider');
    this.providers.set('gemini', getGeminiProvider());
    console.log('[AIProviderFactory] Gemini provider available');
  } catch (error) {
    console.warn('[AIProviderFactory] Failed to initialize Gemini:', error);
  }
} else if (geminiKey && this.isPlaceholderKey(geminiKey)) {
  console.log('[AIProviderFactory] Gemini API key is a placeholder, skipping initialization');
}
```

## Verification

### Server Logs (After Fix):
```
[AIProviderFactory] OpenAI API key is a placeholder, skipping initialization
[GeminiProvider] Initialized with model: gemini-pro
[AIProviderFactory] Gemini provider available
[AIProviderFactory] Available providers: gemini
```

### Dashboard Display:
- **OpenAI**: Not shown (skipped due to placeholder)
- **Gemini**: ✅ Available (real API key configured)

## Environment Configuration

### Current `.env` Files:
```env
# OpenAI - Placeholder (will be skipped)
OPENAI_API_KEY="sk-your-openai-api-key-here"
OPENAI_MODEL="gpt-4"

# Gemini - Real API key (will be initialized)
GEMINI_API_KEY="AIzaSyBnLWn4QZmqr6X00zEom_4RjQgg82sZ1Gg"
GEMINI_MODEL="gemini-pro"
```

## How to Add a Real OpenAI Key

1. Get your API key from: https://platform.openai.com/api-keys

2. Update `.env` and `apps/vyntrize-crm/.env`:
   ```env
   OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxx"  # Your real key
   ```

3. Restart the dev server:
   ```bash
   pnpm dev:crm
   ```

4. Check the logs for:
   ```
   [OpenAIProvider] Initialized with model: gpt-4
   [AIProviderFactory] OpenAI provider available
   ```

## Benefits

1. **Prevents false positives**: Placeholder keys won't show as "available"
2. **Clear logging**: Explicitly logs when a placeholder is detected
3. **Better UX**: Dashboard only shows truly available providers
4. **Fail-fast**: Catches configuration issues early

## Detected Placeholder Patterns

The validation detects these common placeholder patterns (case-insensitive):
- `your-api-key`
- `your-key-here`
- `sk-your-openai-api-key-here`
- `replace-with-your-key`
- `add-your-key-here`
- `your_api_key_here`

## Files Modified
1. `apps/vyntrize-crm/lib/agents/ai-provider-factory.ts` - Added placeholder key validation

## Related Fixes
- Async factory initialization fix (prevents "is not a function" errors)
- Available field fix (shows correct provider status in dashboard)
