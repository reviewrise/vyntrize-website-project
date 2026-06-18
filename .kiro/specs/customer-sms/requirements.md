# Customer SMS Messaging — Requirements

## Overview

Extend the Vyntrize CRM to send SMS messages directly to **customers** (contacts/leads) through the same automation paths that already send email. The SMS infrastructure already exists for internal staff notifications via the `vyntrise-sms` platform (`smsService`). This feature repurposes that infrastructure for outbound customer-facing messaging.

---

## Requirements

### 1. SMS Service Foundation

**1.1** The system MUST use the existing `smsService` (`lib/sms/sms-service.ts`) as the transport layer for all customer SMS. No new SMS provider or SDK is required.

**1.2** The system MUST log every customer SMS attempt (success or failure) to a `SmsLog` database table with the following fields: recipient phone, message content, status (`SENT` | `FAILED` | `SKIPPED`), message ID returned by vyntrise-sms, error message if failed, `leadId`, `contactId`, and `sentAt` timestamp.

**1.3** The system MUST validate that a contact's phone number is in E.164 format before attempting to send. If invalid or absent, the send MUST be silently skipped and logged as `SKIPPED`.

**1.4** The system MUST check the contact's `smsOptOut` flag before sending any customer SMS. If `smsOptOut` is `true`, the send MUST be silently skipped.

**1.5** A `smsOptOut` boolean field MUST be added to the `Contact` model (default `false`).

**1.6** A public opt-out endpoint `GET /api/sms/unsubscribe?phone=...` MUST set `smsOptOut = true` on the matching contact and return a plain-text confirmation. This link can be included in SMS message templates.

---

### 2. SMS Message Templates

**2.1** SMS messages MUST support `{{variable}}` substitution using the existing `TemplateRenderer.render()` method (plain text mode, no HTML).

**2.2** The following template variables MUST be available for all customer SMS:
- `{{firstName}}` — contact first name
- `{{lastName}}` — contact last name
- `{{company}}` — contact company name
- `{{bookingLink}}` — assignee's public booking page URL
- `{{optOutUrl}}` — the opt-out URL for this contact's phone number

**2.3** SMS message content MUST be capped at 1600 characters. Content exceeding this limit MUST be truncated with `...` appended, matching the behavior in `smsService.sendSms()`.

**2.4** SMS messages MUST NOT contain HTML. All content is plain text only.

---

### 3. Workflow Rule Action: `send_sms`

**3.1** The workflow rule engine MUST support a new action type: `send_sms`.

**3.2** The `send_sms` action config MUST accept:
- `message` (string, required) — the plain text message body, supporting `{{variable}}` syntax
- `templateHint` (string, optional) — a hint label for template selection (e.g. `booking_reminder`, `qualification_followup`)

**3.3** When a `send_sms` action fires on a `FULLY_AUTONOMOUS` rule, the system MUST immediately send the SMS to the lead's contact phone number.

**3.4** When a `send_sms` action fires on a `SUGGEST_APPROVE` rule, the system MUST create a pending `AgentAction` record with `actionType: SMS_SEND` for human review. The SMS MUST NOT be sent until approved.

**3.5** If the contact has no phone number or has `smsOptOut = true`, the `send_sms` action MUST skip silently and log a warning. It MUST NOT fail the rule execution or block subsequent actions in the same rule.

**3.6** The `ruleActionSchema` Zod validation MUST be updated to include `send_sms` as a valid action type.

---

### 4. Drip Sequence SMS Steps

**4.1** A `DripStep` MUST support a `stepType` field with values `email` (default, backward-compatible) or `sms`.

**4.2** When `stepType` is `sms`, the drip campaign agent MUST send an SMS using the step's `bodyTemplate` as the message content instead of sending an email.

**4.3** SMS drip steps MUST respect the same `branchCondition` logic as email steps (`always`, `opened`, `not_opened`). Since SMS has no open tracking, `opened` and `not_opened` conditions on SMS steps MUST default to `always` (always proceed).

**4.4** SMS drip steps MUST respect all existing stop conditions (stage reached, score exceeded, meeting scheduled, email replied).

**4.5** The `Contact.smsOptOut` flag MUST be checked before sending any drip SMS step. If opted out, the step MUST be skipped and the enrollment MUST continue to the next step (not stopped entirely).

**4.6** Existing `DripStep` records with no `stepType` field MUST be treated as `email` type to preserve backward compatibility.

---

### 5. Booking Confirmation SMS

**5.1** When a contact books a meeting via `POST /api/book/[slug]`, the system MUST attempt to send an SMS confirmation to the contact's phone number if it was provided in the booking form.

**5.2** The booking confirmation SMS MUST include: the meeting date, time, host name, and Google Meet link (if available).

**5.3** The booking confirmation SMS MUST be sent after the email confirmation and MUST NOT block or delay the email if SMS fails.

**5.4** If the contact has no phone number, the SMS step MUST be silently skipped. The booking MUST still succeed.

**5.5** The booking SMS MUST respect `Contact.smsOptOut`. If opted out, SMS is skipped.

---

### 6. Manual SMS Send API

**6.1** A new endpoint `POST /api/sms/send` MUST allow authenticated CRM users to manually send an SMS to a contact.

**6.2** The request MUST accept: `to` (phone number), `toName` (optional), `message` (plain text body), `contactId` (optional), `leadId` (optional).

**6.3** The endpoint MUST check authentication (session required) and validate the `to` field as E.164 format.

**6.4** The endpoint MUST check `Contact.smsOptOut` if a `contactId` is provided. Opted-out contacts MUST return a `400` with an appropriate error message.

**6.5** Every send attempt MUST be logged to `SmsLog` regardless of success or failure.

**6.6** On success, the endpoint MUST return `{ success: true, messageId: string }`.

---

### 7. Delivery Behavior

**7.1** SMS failures (network errors, gateway errors) MUST be logged but MUST NOT throw exceptions that disrupt the calling automation (workflow rule, drip step, booking confirmation).

**7.2** When vyntrise-sms returns HTTP 403 (recipient opted out at the provider level), the system MUST treat it as a silent skip, set `Contact.smsOptOut = true` for that contact, and log the event. It MUST NOT be treated as a failure.

**7.3** The system MUST NOT retry failed SMS sends automatically. The caller (workflow rule, drip agent) is responsible for any retry logic.

---

### 8. Configuration

**8.1** SMS sending MUST be gated on `VYNTRIZE_SMS_API_KEY` being present in env vars OR `SMS_CONFIG` being set in `SystemSetting`. If neither is configured, all customer SMS sends MUST be silently skipped.

**8.2** The existing `GET /api/notifications/channels/status` endpoint MUST continue to reflect SMS configuration status correctly.

---

### 9. Non-Requirements (Out of Scope)

The following are explicitly out of scope for this feature:

- Inbound SMS / two-way messaging
- SMS delivery receipts or read tracking
- MMS (multimedia messages)
- Changes to the internal staff notification SMS path (notification-service.ts remains unchanged)
- A dedicated SMS campaigns UI (bulk SMS blast to a list)
- Per-contact SMS preference UI (opt-out is handled via the unsubscribe URL only)
