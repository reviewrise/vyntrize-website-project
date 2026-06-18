# Vyntrize CRM — Notification Delivery Guide

This document explains exactly when and how each delivery channel fires, what prerequisites are needed, and how users control what they receive.

---

## Overview

Every notification passes through a single pipeline regardless of which channel delivers it:

```
CRM Event occurs
  → Notification Service creates an in-app record
  → SSE pushes it to the user's browser in real time
  → (if user opted in) Email is sent via SMTP
  → (if user opted in) SMS is sent via vyntrise-sms
```

All three channels (in-app, email, SMS) are controlled per event type by the user in **Notification Settings** → accessible from the bell icon dropdown or the `/notifications` page.

Channels are **fire-and-forget** — a failure on email or SMS never blocks the in-app notification and never throws an error. Everything is logged.

---

## Delivery Channels

### 1. In-App Notification (Bell Icon)

**Always on** by default. Cannot be disabled globally — only per event type.

**What happens:**
- A record is written to `crm_notifications` in the database
- The notification is pushed immediately to the user's open browser tab via Server-Sent Events (SSE)
- The bell badge count increments in real time
- In dev mode, polling every 30 seconds is used instead of SSE (Next.js dev server limitation)

**Prerequisites:**
- User must be logged in when the event fires for SSE delivery. If offline, the notification is still saved and will appear when they next open the CRM.

---

### 2. Email

**Off by default.** User must enable email per event type in Notification Settings.

**What happens:**
- A branded HTML email is sent via SMTP using the admin email configuration
- Subject = notification title
- Body = notification body text + "View in CRM" button if an entity (lead, task, etc.) is linked
- Logged to `email_logs` table for tracking

**Prerequisites:**
- `EMAIL_CONFIG_ADMIN` must be set in `SystemSetting` table OR `SMTP_*` env vars must be configured
- The user must have an email address on their profile (`CrmUser.email`)
- The user must have EMAIL enabled for that event type in their preferences
- The notification must not be flagged as `isSeedOrTest: true`

**Not sent when:**
- SMTP is not configured
- User has no email address
- User has EMAIL disabled for that event type
- Notification is from a seed/test operation

---

### 3. SMS

**Off by default.** User must enable SMS per event type in Notification Settings.

**What happens:**
- A text message is sent via the vyntrise-sms API (`POST https://sms.vyntrise.com/api/v1/messages/send`)
- Message format: `Vyntrize: {event title} — {CRM deep link}`
- Delivery is handled by the vyntrise-sms platform (powered by Twilio)
- Opt-outs (STOP replies) are automatically handled by vyntrise-sms — no CRM code required

**Prerequisites:**
- `VYNTRIZE_SMS_API_KEY` must be set in `.env`
- The user must have a phone number on their profile (`CrmUser.phone`) in E.164 format (e.g. `+15551234567`)
- The user must have SMS enabled for that event type in their preferences
- The notification must not be flagged as `isSeedOrTest: true`

**Not sent when:**
- `VYNTRIZE_SMS_API_KEY` is not set
- User has no phone number
- User has SMS disabled for that event type
- Notification is from a seed/test operation
- Recipient has previously sent a STOP opt-out to the vyntrise-sms platform (API returns 403, silently skipped)

---

## Event Triggers

The following CRM events generate notifications. Each row shows which users receive them and what the default channel state is.

| Event | Trigger | Recipients | In-App | Email default | SMS default |
|---|---|---|---|---|---|
| **New lead created** | A new lead is added to the CRM | Assigned user (if set) + all Admins | Always | Off | Off |
| **Lead stage changed** | A lead moves to a different pipeline stage | Assigned user only | Always | Off | Off |
| **Task assigned** | A task is created and assigned to a user | The assigned user | Always | Off | Off |
| **Task completed** | A task is marked as completed | The user who created the task | Always | Off | Off |
| **Calendar event created** | A calendar event is created | The user who owns the calendar event | Always | Off | Off |
| **Calendar event updated** | A calendar event is modified | The user who owns the calendar event | Always | Off | Off |
| **AI agent action pending** | An AI agent drafts an action requiring human approval (Suggest-Approve or Copilot mode) | All Admins | Always | Off | Off |
| **Meeting attended** | A calendar event is marked as attended | The event owner | Always | Off | Off |
| **Meeting missed** | A calendar event passes without attendance | The event owner | Always | Off | Off |

**Notes:**
- "Assigned user + all Admins" on new lead creation is deduplicated — an admin who is also the assignee receives exactly one notification, not two.
- If a lead has no assigned user, only admins are notified for `LEAD_CREATED`.
- If a lead has no assigned user, `STAGE_CHANGED` fires no notification (logged as a warning).

---

## User Preference Defaults

When a user has no saved preference for a channel/event combination, these defaults apply:

| Channel | Default |
|---|---|
| In-App | **Enabled** |
| Email | **Disabled** (opt-in required) |
| SMS | **Disabled** (opt-in required) |

Users manage preferences at: **Notifications dropdown → Notification Settings**, or at the `/notifications` page → Notification Settings button.

---

## Enabling Channels — Configuration

### Email

Set SMTP credentials in the admin settings UI or directly in `SystemSetting` (key: `EMAIL_CONFIG_ADMIN`). Fallback to env vars:

```bash
SMTP_HOST="smtp.resend.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="resend"
SMTP_PASSWORD="re_your_key_here"
EMAIL_FROM_ADDRESS="sales@yourdomain.com"
```

### SMS

Set the vyntrise-sms API key in `.env`:

```bash
VYNTRIZE_SMS_API_KEY="vsk_live_..."
VYNTRIZE_SMS_BASE_URL="https://sms.vyntrise.com"
```

Or store in the database via admin settings (key: `SMS_CONFIG`):

```json
{ "baseUrl": "https://sms.vyntrise.com", "apiKey": "vsk_live_..." }
```

Users also need a phone number on their profile — set in **Profile Settings**.

---

## Checking Channel Status

```
GET /api/notifications/channels/status
```

Returns:
```json
{
  "channels": {
    "inApp":  { "enabled": true },
    "email":  { "configured": true },
    "sms":    { "configured": true }
  }
}
```

Use this to show/hide channels in the UI based on what's configured in this deployment.

---

## Testing Notifications (Dev Only)

Send a test notification to the currently logged-in user:

```bash
POST /api/notifications/test
Content-Type: application/json

{ "eventType": "LEAD_CREATED" }
```

Available event types: `LEAD_CREATED`, `STAGE_CHANGED`, `TASK_CREATED`, `TASK_COMPLETED`, `CALENDAR_EVENT_CREATED`, `CALENDAR_EVENT_UPDATED`, `AGENT_ACTION_PENDING`, `MEETING_ATTENDED`, `MEETING_MISSED`.

This endpoint is disabled in production (`NODE_ENV === 'production'`).

---

## Delivery Guarantee Behavior

| Scenario | Behavior |
|---|---|
| SSE connection is down when notification is created | Notification saved to DB; delivered on next bell open or after polling interval (30s) |
| SMTP fails to send | Error logged; in-app notification unaffected; no retry |
| SMS API returns error | Error logged; in-app notification unaffected; no retry |
| SMS recipient has opted out | 403 returned by vyntrise-sms; silently skipped; in-app notification unaffected |
| User has no email address | Warning logged; email skipped; SMS and in-app unaffected |
| User has no phone number | Warning logged; SMS skipped; email and in-app unaffected |
| Notification created during seed/test | In-app record written; email and SMS suppressed via `isSeedOrTest: true` flag |
