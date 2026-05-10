# AI Agents System Overview

## Summary

The Vyntrize CRM includes 5 intelligent AI agents that automate sales workflows and provide insights. This document provides a high-level overview of the agent system.

---

## 🤖 The 5 Agents

### 1. Lead Scoring Agent ⭐
**Automatically scores leads 0-100 based on engagement**

- Tracks email opens, clicks, website visits, task completion
- Updates scores in real-time
- Assigns qualification status (Hot, Qualified, Warm, Cold, Unqualified)
- Runs automatically on every lead interaction + daily batch

**Value:** Know which leads to prioritize without manual analysis

---

### 2. Task Automation Agent ✅
**Creates follow-up tasks when leads change stages**

- Automatically creates tasks when leads move to CONTACTED, QUALIFIED, or PROPOSAL_SENT
- Calculates due dates in business days
- Assigns to lead owner
- Prevents duplicate tasks

**Value:** Never forget to follow up on important stage changes

---

### 3. Stagnation Detection Agent 🚨
**Alerts when leads haven't progressed**

- Monitors all active leads daily
- Detects warning (approaching threshold) and critical (exceeded threshold) stagnation
- Creates urgent tasks for critical cases
- Customizable thresholds per stage

**Value:** Catch leads before they go cold

---

### 4. Email Generation Agent ✉️
**AI-powered personalized email drafts**

- Analyzes lead context, engagement, and activities
- Generates stage-appropriate emails with proper tone
- Requires human approval before sending
- Uses OpenAI or Gemini

**Value:** Save time writing emails, maintain personalization

---

### 5. Next Best Action Agent 💡
**AI-powered recommendations for next steps**

- Analyzes comprehensive lead data
- Provides 1-3 actionable recommendations
- Prioritizes by urgency
- Acts as a sales copilot

**Value:** Know exactly what to do next with each lead

---

## 🎯 Autonomy Levels

| Level | Agents | Behavior |
|-------|--------|----------|
| **Fully Autonomous** | Lead Scoring, Task Automation, Stagnation Detection | Execute immediately, no approval needed |
| **Suggest & Approve** | Email Generation | Create draft, require human approval |
| **Copilot** | Next Best Action | Provide suggestions only |

---

## 📊 Agent Dashboard

Access at `/agents` to:

- **Monitor Health**: Agent registry, job queue, AI providers
- **View Actions**: All agent activities with filtering
- **Approve Actions**: Review and approve email drafts
- **Manual Triggers**: Generate emails or get recommendations on-demand
- **Track Metrics**: Performance and success rates

---

## ⚙️ Requirements

### Basic Agents (No AI Required)
- Redis (for job scheduling)
- PostgreSQL (for data storage)

**Agents:** Lead Scoring, Task Automation, Stagnation Detection

### AI-Powered Agents
- OpenAI API key **OR** Gemini API key
- All basic requirements

**Agents:** Email Generation, Next Best Action

---

## 🚀 Quick Start

### 1. Verify Basic Setup
```bash
# Check Redis
redis-cli ping

# Check agents dashboard
http://localhost:3014/agents
```

### 2. Enable AI Features (Optional)
```env
# Add to .env
OPENAI_API_KEY="sk-proj-..."
# OR
GEMINI_API_KEY="AIza..."
```

### 3. Monitor Dashboard
- Check system health (should show "healthy")
- View agent actions as they execute
- Review and approve email drafts

---

## 📈 Expected Results

### After 24 Hours
- Lead scores updated for all leads
- Tasks created for stage changes
- Stagnation alerts for inactive leads

### After 1 Week
- Clear lead score distribution
- Reduced manual task creation
- Fewer leads falling through cracks
- AI-generated emails (if enabled)

### After 1 Month
- Improved lead prioritization
- Faster response times
- Better pipeline visibility
- Data-driven sales decisions

---

## 💡 Best Practices

1. **Review Dashboard Daily**: Check for pending approvals and alerts
2. **Trust the Scores**: Lead scores are data-driven and accurate
3. **Act on Stagnation**: Critical alerts need immediate attention
4. **Customize AI Emails**: Use as starting points, add personal touch
5. **Follow Recommendations**: Next best actions are based on proven patterns

---

## 📚 Documentation

- **Full Documentation**: `apps/vyntrize-crm/lib/agents/AGENTS_DOCUMENTATION.md`
- **Quick Reference**: `apps/vyntrize-crm/lib/agents/QUICK_REFERENCE.md`
- **Dashboard UI Spec**: `.kiro/specs/agent-dashboard-ui/`
- **AI Pipeline Spec**: `.kiro/specs/ai-pipeline-agent/`

---

## 🔧 Configuration

### Environment Variables
```env
# Redis (required)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# AI Provider (optional, for AI agents)
AI_PROVIDER="auto"
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="AIza..."

# Feature Flags (optional, defaults to true)
AGENT_LEAD_SCORING_ENABLED="true"
AGENT_TASK_AUTOMATION_ENABLED="true"
AGENT_STAGNATION_DETECTION_ENABLED="true"
AGENT_EMAIL_GENERATION_ENABLED="true"
AGENT_NEXT_BEST_ACTION_ENABLED="true"
```

---

## 🎓 Learning Path

### Week 1: Basic Agents
1. Understand lead scoring system
2. Review auto-created tasks
3. Monitor stagnation alerts
4. Get familiar with dashboard

### Week 2: AI Features
1. Configure AI provider
2. Generate first email draft
3. Get next best action recommendations
4. Compare AI suggestions with your intuition

### Week 3: Optimization
1. Review agent metrics
2. Adjust stagnation thresholds if needed
3. Customize task templates
4. Fine-tune lead scoring weights (if needed)

### Week 4: Mastery
1. Trust the system
2. Act on recommendations quickly
3. Use agents as part of daily workflow
4. Share insights with team

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| No agents running | Check Redis connection |
| AI features not working | Verify API key is configured |
| Actions not executing | Check autonomy level and approvals |
| Low lead scores | Increase engagement activities |
| Too many stagnation alerts | Review and adjust thresholds |

---

## 📊 Success Metrics

Track these to measure agent effectiveness:

- **Lead Score Distribution**: Are leads moving up?
- **Task Completion Rate**: Are auto-tasks being done?
- **Stagnation Rate**: Is it decreasing?
- **Email Approval Rate**: Are AI drafts good?
- **Pipeline Velocity**: Are leads moving faster?

---

## 🔮 Future Enhancements

Planned agents:
- **Predictive Analytics**: Forecast deal closure probability
- **Stage Progression**: Auto-advance leads through pipeline
- **Drip Campaigns**: Automated email sequences
- **Revenue Forecasting**: Predict monthly/quarterly revenue

---

## 🎯 Key Takeaways

1. **5 Agents**: Lead Scoring, Task Automation, Stagnation Detection, Email Generation, Next Best Action
2. **3 Autonomy Levels**: Fully Autonomous, Suggest & Approve, Copilot
3. **2 Tiers**: Basic (no AI) and AI-Powered (requires API key)
4. **1 Dashboard**: Monitor and control everything at `/agents`

**Bottom Line:** Agents automate routine work, provide insights, and help sales teams focus on selling.
