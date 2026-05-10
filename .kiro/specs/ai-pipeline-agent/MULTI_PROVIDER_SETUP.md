# Multi-Provider AI Setup Guide

The AI Pipeline Agent System now supports multiple AI providers, giving you flexibility in choosing the best AI service for your needs.

## Supported Providers

### 1. OpenAI (GPT-4, GPT-3.5-turbo)
- **Best for:** High-quality responses, complex reasoning
- **Cost:** Higher ($0.03/1K tokens for GPT-4)
- **Speed:** Fast
- **Setup:** Requires OpenAI API key

### 2. Google Gemini (Gemini Pro)
- **Best for:** Cost-effective alternative, good quality
- **Cost:** Lower (free tier available)
- **Speed:** Fast
- **Setup:** Requires Google API key

### 3. Auto-Select
- **Best for:** Automatic fallback, high availability
- **Behavior:** Uses first available provider
- **Setup:** Configure multiple providers

## Quick Setup

### Option 1: OpenAI (Default)

```bash
# Install package (already installed)
# pnpm add openai

# Configure .env
OPENAI_API_KEY="sk-your-key-here"
OPENAI_MODEL="gpt-4"  # or gpt-3.5-turbo
AI_PROVIDER="openai"
```

### Option 2: Google Gemini

```bash
# Install package
cd apps/vyntrize-crm
pnpm add @google/generative-ai

# Configure .env
GEMINI_API_KEY="your-key-here"
GEMINI_MODEL="gemini-pro"
AI_PROVIDER="gemini"
```

### Option 3: Auto-Select (Recommended)

```bash
# Install both packages
cd apps/vyntrize-crm
pnpm add @google/generative-ai

# Configure .env with both keys
OPENAI_API_KEY="sk-your-key-here"
GEMINI_API_KEY="your-key-here"
AI_PROVIDER="auto"  # Uses first available
```

## Configuration

### Environment Variables

Add to `.env` or `apps/vyntrize-crm/.env`:

```bash
# AI Provider Selection
AI_PROVIDER="auto"  # Options: openai, gemini, auto

# OpenAI Configuration
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_MODEL="gpt-4"  # Options: gpt-4, gpt-3.5-turbo

# Google Gemini Configuration
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-pro"  # Options: gemini-pro, gemini-pro-vision

# Redis (Required)
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### Getting API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy and add to `.env`

**Google Gemini:**
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy and add to `.env`

## Provider Selection Logic

The system automatically selects providers based on:

1. **Explicit Selection:** If `AI_PROVIDER` is set to specific provider
2. **Auto-Select:** If `AI_PROVIDER="auto"`, uses first available
3. **Fallback:** If selected provider fails, falls back to any available
4. **Error:** If no providers available, throws error

### Example Scenarios

**Scenario 1: Only OpenAI configured**
```bash
OPENAI_API_KEY="sk-..."
AI_PROVIDER="auto"
# Result: Uses OpenAI
```

**Scenario 2: Only Gemini configured**
```bash
GEMINI_API_KEY="..."
AI_PROVIDER="auto"
# Result: Uses Gemini
```

**Scenario 3: Both configured, prefer OpenAI**
```bash
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="..."
AI_PROVIDER="openai"
# Result: Uses OpenAI, falls back to Gemini if OpenAI fails
```

**Scenario 4: Both configured, auto-select**
```bash
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="..."
AI_PROVIDER="auto"
# Result: Uses first available (OpenAI), falls back to Gemini
```

## Cost Comparison

### OpenAI Pricing (as of 2024)

**GPT-4:**
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens
- Average email: ~500 tokens = $0.015-0.030

**GPT-3.5-turbo:**
- Input: $0.0005 per 1K tokens
- Output: $0.0015 per 1K tokens
- Average email: ~500 tokens = $0.0003-0.0008

### Google Gemini Pricing

**Gemini Pro:**
- Free tier: 60 requests/minute
- Paid: $0.00025 per 1K characters
- Average email: ~2K characters = $0.0005

### Monthly Cost Estimates (100 leads, 10 AI operations/day)

| Provider | Model | Monthly Cost |
|----------|-------|--------------|
| OpenAI | GPT-4 | $50-100 |
| OpenAI | GPT-3.5-turbo | $1-5 |
| Gemini | Gemini Pro | $0-10 (free tier) |

## Usage in Code

### Automatic (Recommended)

```typescript
import { getAIProvider } from '@/lib/agents';

// Uses default provider (auto-selected)
const aiProvider = getAIProvider();
const response = await aiProvider.generateCompletion({
  prompt: "Generate email...",
  systemPrompt: "You are a sales assistant",
  maxTokens: 500,
  temperature: 0.7,
});
```

### Explicit Provider Selection

```typescript
import { getAIProvider } from '@/lib/agents';

// Force specific provider
const openai = getAIProvider('openai');
const gemini = getAIProvider('gemini');

// Use specific provider
const response = await gemini.generateCompletion({...});
```

### Check Available Providers

```typescript
import { aiProviderFactory } from '@/lib/agents';

// Get available providers
const available = aiProviderFactory.getAvailableProviders();
console.log('Available:', available); // ['openai', 'gemini']

// Check if specific provider available
const hasGemini = aiProviderFactory.isProviderAvailable('gemini');

// Get all provider status
const status = aiProviderFactory.getAllProviderStatus();
```

## Health Monitoring

The health endpoint now shows all providers:

```bash
curl http://localhost:3014/api/agents/health
```

Response:
```json
{
  "status": "healthy",
  "components": {
    "aiProviders": {
      "status": "healthy",
      "defaultProvider": "auto",
      "availableProviders": ["openai", "gemini"],
      "providers": {
        "openai": {
          "provider": "OpenAI",
          "model": "gpt-4",
          "circuitOpen": false,
          "failureCount": 0,
          "tokenUsageThisMinute": 1250,
          "cacheSize": 5
        },
        "gemini": {
          "provider": "Google Gemini",
          "model": "gemini-pro",
          "circuitOpen": false,
          "failureCount": 0,
          "tokenUsageThisMinute": 800,
          "cacheSize": 3
        }
      }
    }
  }
}
```

## Troubleshooting

### Issue: "No AI providers available"

**Cause:** No API keys configured

**Solution:**
```bash
# Add at least one API key to .env
OPENAI_API_KEY="sk-..."
# or
GEMINI_API_KEY="..."
```

### Issue: "Provider not available"

**Cause:** Requested provider not configured

**Solution:**
```bash
# Either configure the provider
GEMINI_API_KEY="..."

# Or use auto-select
AI_PROVIDER="auto"
```

### Issue: Gemini package not installed

**Error:** `Cannot find module '@google/generative-ai'`

**Solution:**
```bash
cd apps/vyntrize-crm
pnpm add @google/generative-ai
```

### Issue: High costs with OpenAI

**Solution:** Switch to cheaper model or Gemini
```bash
# Option 1: Use GPT-3.5-turbo
OPENAI_MODEL="gpt-3.5-turbo"

# Option 2: Switch to Gemini
AI_PROVIDER="gemini"
GEMINI_API_KEY="..."
```

## Best Practices

### 1. Use Auto-Select for High Availability

```bash
AI_PROVIDER="auto"
OPENAI_API_KEY="..."
GEMINI_API_KEY="..."
```

This provides automatic fallback if one provider fails.

### 2. Start with Gemini for Development

```bash
AI_PROVIDER="gemini"
GEMINI_API_KEY="..."
```

Free tier is sufficient for development and testing.

### 3. Use GPT-4 for Production Quality

```bash
AI_PROVIDER="openai"
OPENAI_MODEL="gpt-4"
```

Best quality for customer-facing emails.

### 4. Use GPT-3.5-turbo for Cost Optimization

```bash
AI_PROVIDER="openai"
OPENAI_MODEL="gpt-3.5-turbo"
```

Good balance of quality and cost.

### 5. Monitor Provider Performance

```bash
# Check health regularly
curl http://localhost:3014/api/agents/health

# Monitor costs
curl http://localhost:3014/api/agents/metrics
```

## Migration Guide

### From OpenAI-only to Multi-Provider

**Step 1:** Install Gemini package
```bash
cd apps/vyntrize-crm
pnpm add @google/generative-ai
```

**Step 2:** Add Gemini API key
```bash
# Add to .env
GEMINI_API_KEY="your-key-here"
```

**Step 3:** Set to auto-select
```bash
AI_PROVIDER="auto"
```

**Step 4:** Restart application
```bash
pnpm dev
```

**Step 5:** Verify both providers available
```bash
curl http://localhost:3014/api/agents/health
```

## Adding New Providers

To add support for additional providers (Claude, Llama, etc.):

1. Create provider class extending `AIProvider`
2. Implement `generateCompletion()` method
3. Add to `AIProviderFactory`
4. Update environment configuration
5. Update documentation

See `gemini-provider.ts` as example.

## Summary

**Key Benefits:**
- ✅ Multiple AI provider support
- ✅ Automatic fallback
- ✅ Cost optimization options
- ✅ Easy provider switching
- ✅ No code changes required

**Recommended Setup:**
```bash
AI_PROVIDER="auto"
OPENAI_API_KEY="sk-..."  # For quality
GEMINI_API_KEY="..."     # For fallback/cost
```

This gives you the best of both worlds: high quality with OpenAI and cost-effective fallback with Gemini.

---

**Next Steps:**
1. Choose your provider(s)
2. Get API key(s)
3. Configure .env
4. Install packages (if needed)
5. Restart application
6. Test with health endpoint
