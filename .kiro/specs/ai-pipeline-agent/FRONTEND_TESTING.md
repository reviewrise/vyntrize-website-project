# Frontend Testing Guide - AI Agent System

**Quick guide to test the AI agent system in your browser**

---

## 🌐 Method 1: Test via Browser (Easiest)

### Step 1: Log in to CRM

1. Open your browser
2. Go to: `http://localhost:3014`
3. Log in with:
   - **Email:** `admin@vyntrise.com`
   - **Password:** `ChangeMe123!`

---

### Step 2: View Agent Actions

Once logged in, open a new tab and visit:

```
http://localhost:3014/api/agents/actions
```

**You should see JSON like this:**

```json
{
  "actions": [
    {
      "id": "cmownisy1000eswbm17yrbguk",
      "agentType": "STAGNATION_DETECTION",
      "status": "EXECUTED",
      "reasoning": "Lead has been inactive for 6 days",
      "createdAt": "2026-05-08T08:26:52.297Z",
      "leadId": "cmon4iwnk00033wbmm26yep75"
    }
  ]
}
```

**This proves the agents are working!** ✅

---

### Step 3: Check System Health

Visit:
```
http://localhost:3014/api/agents/health
```

**Expected response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-05-08T...",
  "components": {
    "agentRegistry": {
      "status": "healthy",
      "initialized": true
    },
    "jobQueue": {
      "status": "healthy"
    },
    "aiProviders": {
      "status": "healthy",
      "defaultProvider": "auto",
      "availableProviders": ["openai", "gemini"],
      "providers": {
        "gemini": {
          "provider": "Google Gemini",
          "model": "gemini-pro",
          "circuitOpen": false,
          "failureCount": 0
        }
      }
    }
  }
}
```

---

### Step 4: View Agent Metrics

Visit:
```
http://localhost:3014/api/agents/metrics
```

**Expected response:**

```json
{
  "metrics": [
    {
      "agentType": "STAGNATION_DETECTION",
      "metricName": "leads_checked",
      "metricValue": 10,
      "calculatedAt": "2026-05-08T..."
    }
  ]
}
```

---

## 🧪 Method 2: Test with Browser DevTools

### Step 1: Open DevTools

1. Log in to CRM
2. Press `F12` to open DevTools
3. Go to **Console** tab

### Step 2: Test Health Endpoint

Paste this in the console:

```javascript
fetch('/api/agents/health')
  .then(r => r.json())
  .then(data => console.log('Health:', data))
```

### Step 3: Test Actions Endpoint

```javascript
fetch('/api/agents/actions')
  .then(r => r.json())
  .then(data => console.log('Actions:', data))
```

### Step 4: Trigger an Agent

First, get a lead ID from your database or CRM, then:

```javascript
fetch('/api/agents/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'LEAD_SCORING',
    leadId: 'your-lead-id-here'
  })
})
  .then(r => r.json())
  .then(data => console.log('Triggered:', data))
```

---

## 📊 Method 3: View in Database (Visual Confirmation)

### Using pgAdmin or any PostgreSQL client:

1. Connect to: `localhost:5432`
2. Database: `vyntrize_db`
3. Username: `vyntrize_user`
4. Password: `vyntrize_password`

### Run these queries:

**View all agent actions:**
```sql
SELECT 
  "agentType",
  status,
  reasoning,
  "createdAt"
FROM agent_actions
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Count actions by type:**
```sql
SELECT 
  "agentType",
  COUNT(*) as count
FROM agent_actions
GROUP BY "agentType";
```

**View stagnant leads detected:**
```sql
SELECT 
  a."agentType",
  a.reasoning,
  a."createdAt",
  l.title as lead_title,
  c."firstName",
  c."lastName"
FROM agent_actions a
LEFT JOIN crm_leads l ON a."leadId" = l.id
LEFT JOIN crm_contacts c ON l."contactId" = c.id
WHERE a."agentType" = 'STAGNATION_DETECTION'
ORDER BY a."createdAt" DESC;
```

---

## 🎨 Method 4: Create a Simple Test Page (Optional)

If you want a dedicated test page, create this file:

**File:** `apps/vyntrize-crm/app/(crm)/agents/test/page.tsx`

```tsx
'use client';

import { useState } from 'react';

export default function AgentTestPage() {
  const [health, setHealth] = useState<any>(null);
  const [actions, setActions] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/health');
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const getActions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/actions');
      const data = await res.json();
      setActions(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const getMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">AI Agent System Test</h1>

      <div className="space-y-4">
        {/* Health Check */}
        <div className="border rounded-lg p-4">
          <button
            onClick={checkHealth}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Check System Health
          </button>
          {health && (
            <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="border rounded-lg p-4">
          <button
            onClick={getActions}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            View Agent Actions
          </button>
          {actions && (
            <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(actions, null, 2)}
            </pre>
          )}
        </div>

        {/* Metrics */}
        <div className="border rounded-lg p-4">
          <button
            onClick={getMetrics}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            View Metrics
          </button>
          {metrics && (
            <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
```

Then visit: `http://localhost:3014/agents/test`

---

## ✅ What to Look For

### Signs the System is Working:

1. **Health endpoint returns "healthy"** ✅
2. **Actions array has items** ✅
3. **Agent types include STAGNATION_DETECTION** ✅
4. **Status shows EXECUTED** ✅
5. **Timestamps are recent** ✅
6. **AI providers show as available** ✅

### Example of Working System:

```json
{
  "actions": [
    {
      "id": "...",
      "agentType": "STAGNATION_DETECTION",
      "status": "EXECUTED",
      "reasoning": "Lead inactive for 6 days",
      "createdAt": "2026-05-08T08:26:52.297Z"
    }
  ]
}
```

**If you see this, your system is working!** 🎉

---

## 🚨 Troubleshooting

### Issue: "Unauthorized" error

**Solution:** Make sure you're logged in first at `http://localhost:3014`

### Issue: Empty actions array

**Solution:** This is normal if agents haven't run yet. Wait a few minutes or trigger manually.

### Issue: "unhealthy" status

**Solution:** Check that Redis is running:
```bash
docker ps | grep redis
```

### Issue: Can't access endpoints

**Solution:** Make sure CRM is running:
```bash
# Check if port 3014 is in use
netstat -ano | findstr :3014
```

---

## 🎯 Quick Test Checklist

Use this checklist to verify everything:

- [ ] Can log in to CRM
- [ ] Health endpoint returns "healthy"
- [ ] Actions endpoint returns data
- [ ] See STAGNATION_DETECTION actions
- [ ] Actions have EXECUTED status
- [ ] AI providers show as available
- [ ] Metrics endpoint accessible
- [ ] No errors in browser console

**If all checked, your system is working perfectly!** ✅

---

## 📱 Mobile Testing

You can also test on mobile:

1. Find your computer's IP address
2. Visit: `http://YOUR-IP:3014`
3. Log in and test the same endpoints

---

## 🎉 Success Indicators

You'll know it's working when you see:

1. **Agent actions in the database** (you already have 15!)
2. **"healthy" status** in health endpoint
3. **Recent timestamps** on actions
4. **Multiple agent types** executing
5. **No errors** in responses

**Based on your logs, all of these are already true!** Your system is working. 🚀

---

## 📚 Next Steps

Once you've verified it's working:

1. **Explore the actions** - See what agents detected
2. **Check the reasoning** - Understand why agents acted
3. **Monitor over time** - Watch agents work automatically
4. **Trigger manually** - Test specific scenarios
5. **Build a dashboard** - Create a UI for monitoring (optional)

---

**Ready to test? Just open your browser and go to:**

```
http://localhost:3014/api/agents/actions
```

**That's it!** 🎊
