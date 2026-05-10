# How to Use AI Agents - Quick Guide

## ✅ Working Agents (3/5)

### 1. Lead Scoring Agent (Automatic)
**What it does:** Automatically scores leads 0-100 based on engagement

**Triggers:**
- When a lead is created
- When a lead is updated
- When an email is opened
- When an email link is clicked

**No action needed** - runs automatically

---

### 2. Stagnation Detection Agent (Automatic)
**What it does:** Alerts you about inactive leads

**Triggers:**
- Runs daily at 9 AM
- Checks all leads for inactivity

**Alerts for:**
- Warning: No activity for 7+ days
- Critical: No activity for 14+ days

**No action needed** - runs automatically

---

### 3. Task Automation Agent (Automatic) ✨ NEW!
**What it does:** Automatically creates follow-up tasks when you move leads through the pipeline

**Triggers:**
- When you move a lead to CONTACTED
- When you move a lead to QUALIFIED
- When you move a lead to PROPOSAL_SENT

**Tasks Created:**

| Stage | Task | Due Date | Priority |
|-------|------|----------|----------|
| CONTACTED | "Follow up with lead" | 2 business days | MEDIUM |
| QUALIFIED | "Prepare proposal" | 3 business days | HIGH |
| PROPOSAL_SENT | "Follow up on proposal" | 5 business days | HIGH |

**Task Assignment:**
- Assigned to lead owner (if set)
- OR assigned to you (person who changed stage)
- OR unassigned (if neither exists)

**How to use:**
1. Go to `/pipeline`
2. Drag a lead to CONTACTED, QUALIFIED, or PROPOSAL_SENT
3. Task is created automatically
4. Check the lead detail page to see the task

**No action needed** - runs automatically

---

## 🎯 Manual Trigger Agents (2/5)

### 4. Email Generation Agent (Manual Trigger)
**What it does:** Uses AI (Gemini) to generate personalized email drafts

**Requires:**
- ✅ Gemini API key (you have this!)
- Manual trigger from dashboard

**How to use:**

1. **Go to Agent Dashboard**
   - Navigate to `/agents`

2. **Click "Trigger Agent" Button**
   - Top right corner of the dashboard
   - Blue button with lightning bolt icon ⚡

3. **Select Lead**
   - Search for a lead by name
   - Click on the lead

4. **Choose "Email Generation" Agent**
   - Select from agent type dropdown

5. **Click "Trigger"**
   - Agent will generate email draft
   - Status: PENDING (requires approval)

6. **Review & Approve**
   - Click on the action in the dashboard
   - Review the generated email
   - Approve or reject

**Output:**
- Email subject line
- Email body (personalized)
- Reasoning for the email approach

---

### 5. Next Best Action Agent (Manual Trigger)
**What it does:** Uses AI (Gemini) to recommend next steps for a lead

**Requires:**
- ✅ Gemini API key (you have this!)
- Manual trigger from dashboard

**How to use:**

1. **Go to Agent Dashboard**
   - Navigate to `/agents`

2. **Click "Trigger Agent" Button**
   - Top right corner of the dashboard
   - Blue button with lightning bolt icon ⚡

3. **Select Lead**
   - Search for a lead by name
   - Click on the lead

4. **Choose "Next Best Action" Agent**
   - Select from agent type dropdown

5. **Click "Trigger"**
   - Agent will analyze lead and generate recommendations
   - Status: EXECUTED (copilot mode, no approval needed)

6. **View Recommendations**
   - Click on the action in the dashboard
   - See 1-3 recommended actions
   - Each with reasoning and priority

**Output:**
- Recommended actions (e.g., "Schedule demo call")
- Reasoning for each recommendation
- Priority level (HIGH, MEDIUM, LOW)

---

## 📍 Where to Find Things

### Agent Dashboard
**URL:** `/agents`

**Features:**
- View all agent actions
- Filter by agent type, status, date
- Approve/reject pending actions
- **Trigger Agent button** (top right) ⚡
- View performance metrics

### Manual Trigger Modal
**How to open:**
1. Go to `/agents`
2. Click "Trigger Agent" button (top right)

**Features:**
- Search for leads
- Select agent type (Email Generation or Next Best Action)
- Trigger agent for specific lead

### Lead Detail Page
**URL:** `/leads/[id]`

**Features:**
- View lead information
- See automatically created tasks
- View lead score and qualification status
- See activity history

### Pipeline View
**URL:** `/pipeline`

**Features:**
- Drag and drop leads between stages
- Task Automation Agent triggers automatically
- Visual sales pipeline

---

## 🎯 Quick Test Guide

### Test Task Automation (Automatic)
1. Go to `/pipeline`
2. Drag a lead from NEW to CONTACTED
3. Check lead detail page for "Follow up with lead" task
4. Task should be assigned to you or lead owner

### Test Email Generation (Manual)
1. Go to `/agents`
2. Click "Trigger Agent" (top right)
3. Search for a lead
4. Select "Email Generation"
5. Click "Trigger"
6. Wait for email draft to generate
7. Review and approve/reject

### Test Next Best Action (Manual)
1. Go to `/agents`
2. Click "Trigger Agent" (top right)
3. Search for a lead
4. Select "Next Best Action"
5. Click "Trigger"
6. View AI-generated recommendations

---

## 🔧 Troubleshooting

### Task Not Assigned to Anyone
**Fix Applied:** Tasks now assign to:
1. Lead owner (if set)
2. Current user (person who changed stage)
3. Unassigned (if neither exists)

**To assign leads:**
1. Go to lead detail page
2. Edit lead
3. Set "Assigned To" field

### Can't Find Trigger Button
**Location:** `/agents` dashboard, top right corner
**Look for:** Blue button with ⚡ icon labeled "Trigger Agent"

### Email Generation Not Working
**Check:**
1. Gemini API key is set in `.env`
2. Agent dashboard shows Gemini as "Available"
3. You clicked "Trigger Agent" button
4. You selected a lead
5. You selected "Email Generation" agent type

### Next Best Action Not Working
**Check:**
1. Gemini API key is set in `.env`
2. Agent dashboard shows Gemini as "Available"
3. You clicked "Trigger Agent" button
4. You selected a lead
5. You selected "Next Best Action" agent type

---

## 📊 Agent Status Summary

| Agent | Status | Trigger | Approval | AI Required |
|-------|--------|---------|----------|-------------|
| Lead Scoring | ✅ Working | Automatic | No | No |
| Stagnation Detection | ✅ Working | Automatic | No | No |
| Task Automation | ✅ Working | Automatic | No | No |
| Email Generation | ✅ Ready | Manual | Yes | Yes (Gemini) |
| Next Best Action | ✅ Ready | Manual | No | Yes (Gemini) |

---

## 🎉 Success!

All agents are now working! You have:
- ✅ 3 automatic agents running in the background
- ✅ 2 AI-powered agents ready for manual triggering
- ✅ Gemini AI provider configured and available
- ✅ Full agent dashboard with filtering and metrics

**Next Steps:**
1. Test Email Generation agent
2. Test Next Best Action agent
3. Monitor agent performance in dashboard
4. Adjust agent settings as needed

Enjoy your AI-powered CRM! 🚀
