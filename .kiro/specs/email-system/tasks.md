# Email System - Implementation Tasks

## Phase 1: Foundation (Database & Email Service)

### Task 1.1: Database Schema
- [ ] Add EmailCampaign model to Prisma schema
- [ ] Add EmailLog model to Prisma schema
- [ ] Add EmailEvent model to Prisma schema
- [ ] Add EmailQueue model to Prisma schema
- [ ] Add EmailUnsubscribe model to Prisma schema
- [ ] Add relations to existing models (Contact, Lead, User, EmailTemplate)
- [ ] Run Prisma migration
- [ ] Generate Prisma client

### Task 1.2: Environment Configuration
- [ ] Add SMTP configuration variables to .env
- [ ] Add email settings variables to .env
- [ ] Add tracking configuration variables to .env
- [ ] Add queue settings variables to .env
- [ ] Update .env.example files
- [ ] Document SMTP setup for different providers (Gmail, Outlook, etc.)

### Task 1.3: Install Dependencies
- [ ] Install nodemailer
- [ ] Install @types/nodemailer
- [ ] Install html-to-text (for plain text fallback)
- [ ] Install juice (for CSS inlining)

### Task 1.4: Email Service Core
- [ ] Create `lib/email/email-service.ts`
- [ ] Implement EmailService class with Nodemailer
- [ ] Implement connection verification
- [ ] Implement single email sending
- [ ] Implement bulk email sending
- [ ] Add error handling and retry logic
- [ ] Add email validation
- [ ] Add rate limiting

### Task 1.5: Template Renderer
- [ ] Create `lib/email/template-renderer.ts`
- [ ] Implement variable substitution ({{variable}})
- [ ] Implement conditional blocks ({{#if}})
- [ ] Implement loops ({{#each}})
- [ ] Add HTML sanitization
- [ ] Add CSS inlining for email clients
- [ ] Generate plain text version from HTML

### Task 1.6: Tracking Service
- [ ] Create `lib/email/tracking-service.ts`
- [ ] Implement tracking ID generation
- [ ] Implement tracking pixel generation
- [ ] Implement link wrapping for click tracking
- [ ] Add metadata extraction (IP, user agent)
- [ ] Add tracking event recording

## Phase 2: API Endpoints

### Task 2.1: Send Individual Email
- [ ] Create `app/api/email/send/route.ts`
- [ ] Validate request data
- [ ] Check unsubscribe list
- [ ] Render template with variables
- [ ] Add tracking pixel and links
- [ ] Send email via EmailService
- [ ] Create EmailLog record
- [ ] Return success/error response

### Task 2.2: Send Bulk Email
- [ ] Create `app/api/email/bulk/route.ts`
- [ ] Validate request data
- [ ] Create EmailCampaign record
- [ ] Queue emails for each recipient
- [ ] Return campaign ID and status

### Task 2.3: Email History
- [ ] Create `app/api/email/history/[contactId]/route.ts`
- [ ] Query EmailLog for contact/lead
- [ ] Include tracking stats
- [ ] Return paginated results

### Task 2.4: Campaign Management
- [ ] Create `app/api/email/campaigns/route.ts` (GET, POST)
- [ ] Create `app/api/email/campaigns/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Implement campaign creation
- [ ] Implement campaign scheduling
- [ ] Implement campaign stats calculation

### Task 2.5: Tracking Endpoints
- [ ] Create `app/api/email/track/open/[trackingId]/route.ts`
- [ ] Create `app/api/email/track/click/[trackingId]/route.ts`
- [ ] Record open events
- [ ] Record click events
- [ ] Update EmailLog status
- [ ] Return tracking pixel (1x1 transparent GIF)
- [ ] Redirect to original URL for clicks

### Task 2.6: Unsubscribe
- [ ] Create `app/api/email/unsubscribe/route.ts`
- [ ] Add email to unsubscribe list
- [ ] Update contact preferences
- [ ] Return confirmation page

## Phase 3: Email Queue & Background Processing

### Task 3.1: Email Queue Service
- [ ] Create `lib/email/email-queue.ts`
- [ ] Implement queue email function
- [ ] Implement process queue function
- [ ] Add batch processing
- [ ] Add retry logic with exponential backoff
- [ ] Add rate limiting

### Task 3.2: Queue Processor Job
- [ ] Create `lib/jobs/process-email-queue.ts`
- [ ] Implement cron job or scheduled task
- [ ] Process pending emails in batches
- [ ] Update email status
- [ ] Handle failures and retries
- [ ] Log processing stats

### Task 3.3: Queue API Endpoints
- [ ] Create `app/api/email/queue/status/route.ts`
- [ ] Return queue statistics
- [ ] Show pending/processing/failed counts

## Phase 4: Frontend Components

### Task 4.1: EmailComposer Modal
- [ ] Create `components/EmailComposer.tsx`
- [ ] Add template selector
- [ ] Add subject input
- [ ] Add rich text editor (TipTap or similar)
- [ ] Add variable insertion buttons
- [ ] Add preview mode
- [ ] Add send/schedule buttons
- [ ] Add validation
- [ ] Handle API calls

### Task 4.2: EmailHistory Component
- [ ] Create `components/EmailHistory.tsx`
- [ ] Display email list with status
- [ ] Show open/click indicators
- [ ] Add email detail modal
- [ ] Add pagination
- [ ] Add filtering

### Task 4.3: BulkEmailSelector
- [ ] Create `components/BulkEmailSelector.tsx`
- [ ] Add contact list with checkboxes
- [ ] Add select all/none
- [ ] Add filter controls
- [ ] Show selected count
- [ ] Add bulk send button

### Task 4.4: EmailCampaignDashboard
- [ ] Create `app/(crm)/campaigns/page.tsx`
- [ ] Display campaign list
- [ ] Show campaign stats
- [ ] Add create campaign button
- [ ] Add campaign detail view
- [ ] Add charts for analytics

### Task 4.5: Integration with Contact/Lead Pages
- [ ] Add "Send Email" button to contact detail page
- [ ] Add "Send Email" button to lead detail page
- [ ] Add EmailHistory to contact timeline
- [ ] Add EmailHistory to lead timeline
- [ ] Add bulk email action to contacts list
- [ ] Add bulk email action to leads list

## Phase 5: Automated Workflows

### Task 5.1: Workflow Engine
- [ ] Create `lib/workflows/workflow-engine.ts`
- [ ] Define workflow triggers (lead created, stage changed, etc.)
- [ ] Define workflow actions (send email, wait, etc.)
- [ ] Implement workflow execution
- [ ] Add workflow scheduling

### Task 5.2: Workflow Database Schema
- [ ] Add EmailWorkflow model
- [ ] Add WorkflowStep model
- [ ] Add WorkflowExecution model
- [ ] Run migration

### Task 5.3: Workflow UI
- [ ] Create `app/(crm)/workflows/page.tsx`
- [ ] Add workflow builder UI
- [ ] Add trigger configuration
- [ ] Add action configuration
- [ ] Add workflow testing

### Task 5.4: Built-in Workflows
- [ ] Welcome email for new leads
- [ ] Follow-up email on stage change
- [ ] Task assignment notification
- [ ] Lead assignment notification
- [ ] Nurture sequence (drip campaign)

## Phase 6: Testing & Documentation

### Task 6.1: Testing
- [ ] Test SMTP connection with different providers
- [ ] Test single email sending
- [ ] Test bulk email sending
- [ ] Test email tracking (opens/clicks)
- [ ] Test email queue processing
- [ ] Test unsubscribe functionality
- [ ] Test automated workflows
- [ ] Load test with 1000+ emails

### Task 6.2: Documentation
- [ ] Document SMTP setup guide
- [ ] Document email template variables
- [ ] Document API endpoints
- [ ] Document workflow creation
- [ ] Create user guide for sending emails
- [ ] Create admin guide for configuration

### Task 6.3: Monitoring & Logging
- [ ] Add email sending metrics
- [ ] Add queue processing metrics
- [ ] Add error logging
- [ ] Add delivery rate monitoring
- [ ] Create email analytics dashboard

## Phase 7: Advanced Features (Optional)

### Task 7.1: Email Scheduling
- [ ] Add schedule picker to EmailComposer
- [ ] Store scheduled emails in queue
- [ ] Process scheduled emails at specified time

### Task 7.2: Email Attachments
- [ ] Add file upload to EmailComposer
- [ ] Store attachments temporarily
- [ ] Send attachments with email
- [ ] Clean up temporary files

### Task 7.3: Email Signatures
- [ ] Add signature editor to user settings
- [ ] Automatically append signature to emails
- [ ] Support HTML signatures

### Task 7.4: Email Threading
- [ ] Track email threads/conversations
- [ ] Display threaded view in history
- [ ] Support reply-to functionality

## Estimated Timeline
- Phase 1: 2-3 days
- Phase 2: 2-3 days
- Phase 3: 1-2 days
- Phase 4: 3-4 days
- Phase 5: 2-3 days
- Phase 6: 1-2 days
- Phase 7: 2-3 days (optional)

**Total: 13-20 days for full implementation**

## Priority Order
1. Phase 1 (Foundation) - CRITICAL
2. Phase 2 (API Endpoints) - CRITICAL
3. Phase 4 (Frontend Components) - HIGH
4. Phase 3 (Email Queue) - HIGH
5. Phase 5 (Workflows) - MEDIUM
6. Phase 6 (Testing) - HIGH
7. Phase 7 (Advanced) - LOW
