# AI Agents Quick Reference

## 🤖 5 Agents at a Glance

| Agent | What It Does | Autonomy | When It Runs |
|-------|--------------|----------|--------------|
| **Lead Scoring** | Calculates lead scores (0-100) based on engagement | ✅ Fully Autonomous | Event-driven + Daily |
| **Task Automation** | Creates follow-up tasks when stage changes | ✅ Fully Autonomous | Event-driven |
| **Stagnation Detection** | Alerts on inactive leads | ✅ Fully Autonomous | Daily at 9 AM |
| **Email Generation** | AI-powered email drafts | ⚠️ Requires Approval | On-demand |
| **Next Best Action** | AI-powered recommendations | 💡 Suggestions Only | On-demand |

---

## 🎯 Quick Decision Guide

### "I want to..."

**...automatically score my leads**
→ Use **Lead Scoring Agent** (already running!)

**...never forget to follow up**
→ Use **Task Automation Agent** (already running!)

**...catch leads that are going cold**
→ Use **Stagnation Detection Agent** (already running!)

**...get help writing emails**
→ Use **Email Generation Agent** (requires AI provider)

**...know what to do next with a lead**
→ Use **Next Best Action Agent** (requires AI provider)

---

## ⚙️ Setup Checklist

### Basic Setup (No AI Required)
- [x] Redis running on localhost:6379
- [x] Lead Scoring Agent enabled
- [x] Task Automation Agent enabled
- [x] Stagnation Detection Agent enabled

### AI-Powered Features
- [ ] OpenAI API key configured **OR**
- [ ] Gemini API key configured
- [ ] Email Generation Agent enabled
- [ ] Next Best Action Agent enabled

---

## 📊 Lead Score Breakdown

| Score | Status | What It Means |
|-------|--------|---------------|
| 80-100 | 🔥 Hot | Highly engaged, ready to buy |
| 60-79 | ✅ Qualified | Strong prospect, move forward |
| 40-59 | 🌡️ Warm | Needs nurturing |
| 20-39 | ❄️ Cold | Low engagement, re-engage |
| 0-19 | ⛔ Unqualified | Minimal engagement |

**Score Factors:**
- Email opens: +5 each
- Email clicks: +10 each
- Email replies: +15 each
- Website visits: +8 each
- Completed tasks: +12 each
- Inactivity: -2 per day (max -40)

---

## 🚨 Stagnation Thresholds

| Stage | ⚠️ Warning | 🚨 Critical |
|-------|-----------|------------|
| NEW | 3 days | 7 days |
| CONTACTED | 7 days | 14 days |
| QUALIFIED | 10 days | 21 days |
| PROPOSAL_SENT | 7 days | 14 days |

**Critical = Urgent task created automatically**

---

## 📧 Email Tones by Stage

| Stage | Tone |
|-------|------|
| NEW | Friendly and introductory |
| CONTACTED | Professional and engaging |
| QUALIFIED | Consultative and value-focused |
| PROPOSAL_SENT | Confident and action-oriented |
| WON | Celebratory and onboarding |
| LOST | Gracious and door-open |

---

## 🎚️ Autonomy Levels

| Level | Symbol | Behavior | Used By |
|-------|--------|----------|---------|
| **Fully Autonomous** | ✅ | Executes immediately | Lead Scoring, Task Automation, Stagnation Detection |
| **Suggest & Approve** | ⚠️ | Requires approval | Email Generation |
| **Copilot** | 💡 | Suggestions only | Next Best Action |

---

## 🔧 Quick Commands

### Check System Health
```bash
# Visit dashboard
http://localhost:3014/agents

# Check Redis
redis-cli ping
```

### Enable/Disable Agents
```env
# In .env file
AGENT_LEAD_SCORING_ENABLED="true"
AGENT_TASK_AUTOMATION_ENABLED="true"
AGENT_STAGNATION_DETECTION_ENABLED="true"
AGENT_EMAIL_GENERATION_ENABLED="true"
AGENT_NEXT_BEST_ACTION_ENABLED="true"
```

### Configure AI Providers
```env
# OpenAI
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4"

# OR Gemini
GEMINI_API_KEY="AIza..."
GEMINI_MODEL="gemini-pro"

# Auto-select first available
AI_PROVIDER="auto"
```

---

## 📍 Dashboard Locations

- **Main Dashboard**: `/agents`
- **Health Status**: Top of dashboard
- **Action List**: Middle section with filters
- **Manual Triggers**: "Trigger Agent" button
- **Metrics**: Bottom section

---

## 🆘 Common Issues

### "No AI providers available"
→ Add OpenAI or Gemini API key to `.env`

### "Agent not running"
→ Check feature flag: `AGENT_[TYPE]_ENABLED="true"`

### "Redis connection failed"
→ Start Redis: `redis-server` or check port 6379

### "Actions not executing"
→ Check autonomy level (some require approval)

---

## 💡 Pro Tips

1. **Let agents run for 24 hours** before judging effectiveness
2. **Review pending actions daily** (Email Generation requires approval)
3. **Trust the lead scores** - they're data-driven
4. **Act on critical stagnation alerts** immediately
5. **Customize AI-generated emails** before sending
6. **Use Next Best Action** when unsure what to do next

---

## 📈 Success Metrics

Track these in the dashboard:

- **Lead Score Distribution**: Are leads moving up?
- **Task Completion Rate**: Are auto-created tasks being done?
- **Stagnation Alerts**: Are they decreasing over time?
- **Email Approval Rate**: Are AI drafts being approved?
- **Action Success Rate**: Are agents performing well?

---

## 🔗 Quick Links

- [Full Documentation](./AGENTS_DOCUMENTATION.md)
- [Agent Dashboard](/agents)
- [AI Provider Setup](./README.md)
- [Troubleshooting Guide](./AGENTS_DOCUMENTATION.md#troubleshooting)

---

## 📞 Need Help?

1. Check [Full Documentation](./AGENTS_DOCUMENTATION.md)
2. Review dashboard for error messages
3. Check server logs for detailed errors
4. Verify environment variables are set correctly
