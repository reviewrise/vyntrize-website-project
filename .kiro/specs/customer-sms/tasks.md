# Customer SMS Messaging — Tasks

## Implementation Plan

Tasks are ordered by dependency. Complete each group before starting the next — later tasks import from earlier ones.

---

## Phase 1: Database & Schema Foundation

- [ ] 1. Update Prisma schema with SMS models and fields

  Add the following to `packages/@platform/vyntrize-db/prisma/schema.prisma`:
  - New `SmsStatus` enum with values: `QUEUED`, `SENT`, `FAILED`, `SKIPPED`
  - New `SmsLog` model with fields: `id`, `createdAt`, `updatedAt`, `toPhone`, `toName`, `content`, `status` (SmsStatus, default QUEUED), `messageId`, `sentAt`, `errorMessage`, `contactId` (optional FK → Contact), `leadId` (optional FK → Lead with relation name `"SmsLogLead"`). Add indexes on `contactId`, `leadId`, `status`, `createdAt`. Map to `"sms_logs"` table.
  - `Contact` model: add `smsOptOut Boolean @default(false)` field and `smsLogs SmsLog[]` relation
  - `Lead` model: add `smsLogs SmsLog[] @relation("SmsLogLead")` relation
  - `DripStep` model: add `stepType String @default("email")` field
  - `ActionType` enum: add `SMS_SEND` value

  After editing the schema, generate the migration:
  ```bash
  cd packages/@platform/vyntrize-db
  npx prisma migrate dev --name add-customer-sms
  ```
  Then regenerate the Prisma client:
  ```bash
  npx prisma generate
  ```

  **Acceptance criteria:**
  - `prisma migrate dev` completes without errors
  - `prisma generate` completes without errors
  - `SmsLog`, `SmsStatus`, `Contact.smsOptOut`, `DripStep.stepType`, and `ActionType.SMS_SEND` are all accessible in the generated client types

---

## Phase 2: Core Library Files

- [ ] 2. Create `buildBookingConfirmationSms()` pure helper

  **File:** `apps/vyntrize-crm/lib/sms/booking-sms.ts`

  Create a pure function with no external dependencies (no Prisma, no smsService):

  ```typescript
  interface BookingConfirmationSmsOptions {
    hostName: string;
    startTime: Date;
    meetLink?: string;
    optOutUrl: string;
  }

  export function buildBookingConfirmationSms(options: BookingConfirmationSmsOptions): string
  ```

  The output must be plain text (no HTML) and include:
  - Host name
  - Formatted start time (e.g. `Tuesday, June 20 at 2:00 PM UTC`)
  - Google Meet link if provided
  - Opt-out URL on the last line

  Example output:
  ```
  Your meeting with Jane Smith is confirmed for Tuesday, June 20 at 2:00 PM UTC. Join here: https://meet.google.com/xxx To stop SMS: https://crm.vyntrize.com/api/sms/unsubscribe?phone=...
  ```

  **Acceptance criteria:**
  - Function is a pure function (no side effects)
  - Output contains host name and start time for any valid input
  - Output contains meet link when provided, omits it when undefined
  - Output length ≤ 300 characters for typical inputs

- [ ] 3. Create `buildSmsTemplateVars()` helper

  **File:** `apps/vyntrize-crm/lib/sms/sms-template-vars.ts`

  ```typescript
  import type { Contact, Lead } from '@platform/vyntrize-db';
  import type { TemplateVariables } from '@/lib/email/template-renderer';

  export function buildSmsTemplateVars(
    contact: Contact | null | undefined,
    lead: Lead & { contact?: Contact }
  ): TemplateVariables
  ```

  Returns an object with keys: `firstName`, `lastName`, `company`, `bookingLink`, `optOutUrl`. All values default to empty string when source data is absent. `bookingLink` uses `lead.assigneeId` to construct `${NEXT_PUBLIC_CRM_URL}/book/${assigneeId}`. `optOutUrl` uses `contact.phone` encoded for the unsubscribe endpoint.

  **Acceptance criteria:**
  - All 5 keys are always present in the returned object
  - No key has an undefined value (empty string for missing data)
  - `optOutUrl` is an empty string when `contact.phone` is absent

- [ ] 4. Create `sendCustomerSms()` shared helper

  **File:** `apps/vyntrize-crm/lib/sms/send-customer-sms.ts`

  This is the single error boundary for all customer-facing SMS. Implement the exact internal logic sequence from the design:

  1. Config gate — `smsService.getConfig()` → if null, log SKIPPED, return
  2. Phone presence check — if `to` is null/empty, log SKIPPED, return
  3. E.164 validation — regex `/^\+[1-9]\d{6,14}$/`, if invalid, log SKIPPED, return
  4. smsOptOut check — if `contactId` provided, query contact; if `smsOptOut === true`, log SKIPPED, return
  5. Template rendering — `TemplateRenderer.render(message, variables)` if variables provided
  6. Send — `smsService.sendSms({ to, content: renderedMessage })`
  7. 403 backfill — if `result.skipped === true` and `contactId` known, `prisma.contact.update({ data: { smsOptOut: true } })`
  8. SmsLog creation — always, with correct status
  9. Return result struct — never throw

  Wrap entire function body in `try/catch`. On uncaught error: log FAILED to SmsLog, return `{ sent: false, skipped: false, failed: true, error: err.message }`.

  Export the interfaces:
  ```typescript
  export interface CustomerSmsOptions { to, message, variables?, leadId?, contactId? }
  export interface CustomerSmsResult { sent, skipped, failed, messageId?, error? }
  export async function sendCustomerSms(options: CustomerSmsOptions): Promise<CustomerSmsResult>
  ```

  **Acceptance criteria:**
  - Null/empty/invalid phone → returns `{ skipped: true }`, SmsLog with status SKIPPED, `smsService.sendSms` NOT called
  - `smsOptOut=true` contact → returns `{ skipped: true }`, SmsLog SKIPPED, smsService NOT called
  - Valid send → returns `{ sent: true, messageId }`, SmsLog with status SENT
  - `smsService.sendSms` throws → returns `{ failed: true }`, SmsLog FAILED, no exception propagated
  - Provider 403 (skipped=true) → `Contact.smsOptOut` set to true, SmsLog SKIPPED
  - No SMS config → returns `{ skipped: true }`, no smsService call, SmsLog SKIPPED

---

## Phase 3: API Routes

- [ ] 5. Create `GET /api/sms/unsubscribe` route

  **File:** `apps/vyntrize-crm/app/api/sms/unsubscribe/route.ts`

  Public endpoint (no auth). Accepts `?phone=<E164>`. Logic:
  1. Read `phone` query param; if missing, return `400 text/plain "Missing phone parameter"`
  2. URL-decode the phone value
  3. `prisma.contact.findFirst({ where: { phone: decodedPhone } })`
  4. If not found: return `200 text/plain "You have been unsubscribed from SMS messages."` (do not reveal whether number exists)
  5. If found: `prisma.contact.update({ where: { id }, data: { smsOptOut: true } })`, return `200 text/plain "You have been unsubscribed from SMS messages."`

  **Acceptance criteria:**
  - Missing `phone` param returns `400`
  - Known phone number sets `Contact.smsOptOut = true`
  - Unknown phone number returns `200` with neutral message (no 404)
  - Response Content-Type is `text/plain`

- [ ] 6. Create `POST /api/sms/send` route

  **File:** `apps/vyntrize-crm/app/api/sms/send/route.ts`

  Authenticated endpoint. Mirrors structure of `app/api/email/send/route.ts`. Logic:
  1. `getSession()` — return `401` if not logged in
  2. Parse body as `{ to: string, toName?: string, message: string, contactId?: string, leadId?: string }`
  3. Validate required fields; return `400 { error: 'Missing required fields: to, message' }` if missing
  4. Validate `to` with E.164 regex; return `400 { error: 'Invalid phone number format' }` if bad
  5. If `contactId` provided: query contact, check `smsOptOut`; return `400 { error: 'Contact has opted out of SMS' }` if true
  6. Call `sendCustomerSms({ to, message, contactId, leadId })`
  7. If `result.failed`: return `500 { error: result.error || 'Failed to send SMS' }`
  8. Return `200 { success: true, messageId: result.messageId }`

  **Acceptance criteria:**
  - Unauthenticated request returns `401`
  - Missing `to` or `message` returns `400`
  - Invalid E.164 returns `400`
  - Opted-out contact returns `400`
  - Successful send returns `200 { success: true, messageId }`
  - SmsLog row is created for every attempt

---

## Phase 4: Automation Schema

- [ ] 7. Update automation Zod schemas for SMS

  **File:** `apps/vyntrize-crm/lib/automation/schemas.ts` (or wherever `ruleActionSchema` and `dripStepInputSchema` are defined — search for `ruleActionSchema`)

  **`ruleActionSchema`** — add a new discriminated union member:
  ```typescript
  z.object({
    type: z.literal('send_sms'),
    config: z.object({
      message: z.string().min(1, 'Message is required'),
      templateHint: z.string().optional(),
    }),
  }),
  ```

  **`dripStepInputSchema`** — add optional `stepType` field with default:
  ```typescript
  stepType: z.enum(['email', 'sms']).optional().default('email'),
  ```

  **Acceptance criteria:**
  - `ruleActionSchema.parse({ type: 'send_sms', config: { message: 'Hello' } })` succeeds
  - `ruleActionSchema.parse({ type: 'send_sms', config: { message: '' } })` throws ZodError
  - `ruleActionSchema.parse({ type: 'send_sms', config: {} })` throws ZodError (missing message)
  - Existing action types (`send_email`, `create_task`, `enroll_drip`, etc.) still parse correctly
  - `dripStepInputSchema.parse({ ...validStep })` without `stepType` produces `stepType: 'email'` in output

---

## Phase 5: Workflow Rule Engine

- [ ] 8. Add `send_sms` action to WorkflowRuleEngine

  **File:** `apps/vyntrize-crm/lib/agents/workflow-rule-engine.ts`

  In `executeAction()`, add a new `case 'send_sms':` to the switch statement, after the existing `case 'send_email':`. Implementation:

  ```typescript
  case 'send_sms': {
    const { message, templateHint } = action.config as { message: string; templateHint?: string };
    const contact = await prisma.contact.findUnique({ where: { id: lead.contactId } });

    if (rule.autonomyLevel === 'SUGGEST_APPROVE') {
      await prisma.agentAction.create({
        data: {
          agentType: this.agentType,
          actionType: ActionType.SMS_SEND,
          leadId: lead.id,
          reasoning: `Pending SMS approval for rule "${rule.name}"`,
          autonomyLevel: AutonomyLevel.SUGGEST_APPROVE,
          status: ActionStatus.PENDING,
          metadata: { ruleId: rule.id, ruleName: rule.name, message, templateHint },
        },
      });
      break;
    }

    const templateVars = buildSmsTemplateVars(contact, lead);
    await sendCustomerSms({
      to: contact?.phone,
      message,
      variables: templateVars,
      leadId: lead.id,
      contactId: contact?.id,
    });
    break;
  }
  ```

  Import `sendCustomerSms` from `@/lib/sms/send-customer-sms` and `buildSmsTemplateVars` from `@/lib/sms/sms-template-vars` at the top of the file.

  **Acceptance criteria:**
  - Workflow rule with `send_sms` action and `FULLY_AUTONOMOUS` fires `sendCustomerSms()`
  - Workflow rule with `send_sms` action and `SUGGEST_APPROVE` creates a pending `AgentAction` with `actionType: SMS_SEND`
  - If `sendCustomerSms()` skips (opted-out contact), subsequent rule actions still execute (error isolation is preserved by the existing per-action try/catch)
  - No changes to existing action types

---

## Phase 6: Drip Campaign Agent

- [ ] 9. Add SMS step support to DripCampaignAgent

  **File:** `apps/vyntrize-crm/lib/agents/drip-campaign-agent.ts`

  **Part A — `processStep()` method:**

  After fetching `currentStep` and evaluating `branchPasses`, replace the direct email send block with a step-type branch:

  ```typescript
  const stepType = (currentStep as any).stepType ?? 'email';

  if (stepType === 'sms') {
    const contact = (lead as LeadWithContact).contact;
    const templateVars = buildSmsTemplateVars(contact, lead as any);
    try {
      await sendCustomerSms({
        to: contact.phone,
        message: currentStep.bodyTemplate,
        variables: templateVars,
        leadId: lead.id,
        contactId: contact.id,
      });
    } catch (smsErr) {
      this.log('error', 'SMS drip step error (continuing enrollment)', smsErr);
    }

    await this.recordAction(
      ActionType.SMS_SEND,
      lead.id,
      `Drip SMS step ${currentStep.stepOrder} sent for sequence ${typedEnrollment.sequence.name}`,
      AutonomyLevel.FULLY_AUTONOMOUS,
      { enrollmentId, sequenceId: enrollment.sequenceId, stepOrder: currentStep.stepOrder }
    );
  } else {
    // Existing email logic — unchanged
    // ... (keep all existing email send code here)
  }
  ```

  The enrollment index advancement and next-step scheduling code (after the send block) remains outside both branches and is unchanged.

  **Part B — `checkBranchCondition()` method:**

  Add a `stepType` parameter to `checkBranchCondition()` and override opened/not_opened for SMS:

  ```typescript
  private async checkBranchCondition(
    leadId: string,
    branchCondition: string,
    stepType: string = 'email'
  ): Promise<boolean> {
    // For SMS steps, opened/not_opened are not applicable — always proceed
    if (stepType === 'sms' && (branchCondition === 'opened' || branchCondition === 'not_opened')) {
      return true;
    }
    // ... rest of existing logic unchanged
  }
  ```

  Update the call site in `processStep()` to pass `stepType`:
  ```typescript
  const branchPasses = await this.checkBranchCondition(lead.id, currentStep.branchCondition, stepType);
  ```

  Import `sendCustomerSms` from `@/lib/sms/send-customer-sms` and `buildSmsTemplateVars` from `@/lib/sms/sms-template-vars`.

  **Acceptance criteria:**
  - `DripStep` with `stepType='sms'` → `sendCustomerSms()` called, `emailService.sendEmail()` NOT called
  - `DripStep` with `stepType='email'` or no `stepType` → existing email logic runs unchanged
  - SMS step with `branchCondition='opened'` → proceeds (returns `true`)
  - SMS step with `branchCondition='not_opened'` → proceeds (returns `true`)
  - Opted-out contact → SMS skipped silently, `currentStepIndex` still incremented, enrollment remains ACTIVE
  - SMS send error → caught, enrollment continues to next step

---

## Phase 7: Booking Confirmation SMS

- [ ] 10. Add SMS confirmation to booking route

  **File:** `apps/vyntrize-crm/app/api/book/[slug]/route.ts`

  After the existing `await sendBookingConfirmation({ ... })` call (step 5 in the route), add a non-blocking SMS send (step 6). This must be wrapped in a try/catch to guarantee the SMS never blocks or fails the booking response:

  ```typescript
  // 6. Send booking confirmation SMS (fire-and-forget)
  if (contact.phone) {
    try {
      const crmBase = process.env.NEXT_PUBLIC_CRM_URL ?? 'https://crm.vyntrize.com';
      const smsMessage = buildBookingConfirmationSms({
        hostName: user.displayName,
        startTime: event.startTime,
        meetLink: event.meetLink ?? undefined,
        optOutUrl: `${crmBase}/api/sms/unsubscribe?phone=${encodeURIComponent(contact.phone)}`,
      });
      await sendCustomerSms({
        to: contact.phone,
        message: smsMessage,
        contactId: contact.id,
        leadId: lead.id,
      });
    } catch (smsErr) {
      console.error('[book/slug] Booking SMS failed (non-fatal):', smsErr);
    }
  }
  ```

  Import `buildBookingConfirmationSms` from `@/lib/sms/booking-sms` and `sendCustomerSms` from `@/lib/sms/send-customer-sms`.

  **Acceptance criteria:**
  - Booking with phone → `SmsLog` row created after successful booking
  - Booking without phone → SMS silently skipped, booking still succeeds
  - SMS send error → booking still succeeds (error is caught and logged, not re-thrown)
  - `Contact.smsOptOut = true` → SMS skipped via `sendCustomerSms()`, booking still succeeds
  - SMS is sent AFTER the email confirmation (order preserved)

---

## Phase 8: Verification

- [ ] 11. Run build and type check

  From the workspace root:
  ```bash
  cd apps/vyntrize-crm
  npx tsc --noEmit
  ```

  Fix any TypeScript errors before proceeding.

  **Acceptance criteria:**
  - `tsc --noEmit` completes with 0 errors on the CRM app
  - All new files are importable from their expected paths

- [ ] 12. Verify database migration applies cleanly

  ```bash
  cd packages/@platform/vyntrize-db
  npx prisma migrate deploy
  ```

  **Acceptance criteria:**
  - Migration applies without errors
  - `sms_logs` table exists with correct columns
  - `contact.sms_opt_out` column exists with default `false`
  - `drip_steps.step_type` column exists with default `'email'`
  - `ActionType` enum includes `SMS_SEND`
