# Email System - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  • EmailComposer Modal                                       │
│  • EmailHistory Component                                    │
│  • BulkEmailSelector                                         │
│  • EmailCampaignDashboard                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Endpoints                           │
├─────────────────────────────────────────────────────────────┤
│  • POST /api/email/send                                      │
│  • POST /api/email/bulk                                      │
│  • GET  /api/email/history/:contactId                        │
│  • POST /api/email/campaigns                                 │
│  • GET  /api/email/campaigns/:id                             │
│  • GET  /api/email/track/open/:trackingId                    │
│  • GET  /api/email/track/click/:trackingId                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Email Service Layer                       │
├─────────────────────────────────────────────────────────────┤
│  • EmailService (Nodemailer wrapper)                         │
│  • TemplateRenderer (variable substitution)                  │
│  • EmailQueue (background processing)                        │
│  • TrackingService (opens/clicks)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SMTP Server                               │
│  (Gmail, Outlook, Custom SMTP)                               │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### EmailCampaign
```prisma
model EmailCampaign {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  name        String
  subject     String
  templateId  Int?
  template    EmailTemplate? @relation(fields: [templateId], references: [id])
  
  status      String   // 'draft', 'scheduled', 'sending', 'sent', 'failed'
  scheduledAt DateTime?
  sentAt      DateTime?
  
  // Targeting
  targetType  String   // 'all', 'filtered', 'manual'
  targetFilter Json?   // Filter criteria for contacts
  
  // Stats
  totalRecipients Int @default(0)
  sentCount       Int @default(0)
  deliveredCount  Int @default(0)
  openedCount     Int @default(0)
  clickedCount    Int @default(0)
  bouncedCount    Int @default(0)
  
  // Relations
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  emails      EmailLog[]
  
  @@map("email_campaigns")
}
```

### EmailLog
```prisma
model EmailLog {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Email details
  subject     String
  body        String   @db.Text
  htmlBody    String?  @db.Text
  fromEmail   String
  fromName    String?
  toEmail     String
  toName      String?
  
  // Tracking
  trackingId  String   @unique
  status      String   // 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  sentAt      DateTime?
  deliveredAt DateTime?
  openedAt    DateTime?
  clickedAt   DateTime?
  bouncedAt   DateTime?
  failedAt    DateTime?
  errorMessage String?  @db.Text
  
  // Relations
  contactId   String?
  contact     Contact? @relation(fields: [contactId], references: [id])
  leadId      String?
  lead        Lead?    @relation(fields: [leadId], references: [id])
  campaignId  String?
  campaign    EmailCampaign? @relation(fields: [campaignId], references: [id])
  templateId  Int?
  template    EmailTemplate? @relation(fields: [templateId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  // Events
  events      EmailEvent[]
  
  @@index([contactId])
  @@index([leadId])
  @@index([campaignId])
  @@index([status])
  @@index([createdAt])
  @@map("email_logs")
}
```

### EmailEvent
```prisma
model EmailEvent {
  id          Int      @id @default(autoincrement())
  createdAt   DateTime @default(now())
  
  emailLogId  String
  emailLog    EmailLog @relation(fields: [emailLogId], references: [id], onDelete: Cascade)
  
  eventType   String   // 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  eventData   Json?    // Additional event data (IP, user agent, link clicked, etc.)
  
  @@index([emailLogId])
  @@index([eventType])
  @@map("email_events")
}
```

### EmailQueue
```prisma
model EmailQueue {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  emailData   Json     // Serialized email data
  status      String   // 'pending', 'processing', 'completed', 'failed'
  attempts    Int      @default(0)
  maxAttempts Int      @default(3)
  scheduledFor DateTime?
  processedAt DateTime?
  errorMessage String?  @db.Text
  
  @@index([status])
  @@index([scheduledFor])
  @@map("email_queue")
}
```

### EmailUnsubscribe
```prisma
model EmailUnsubscribe {
  id          Int      @id @default(autoincrement())
  createdAt   DateTime @default(now())
  
  email       String   @unique
  reason      String?
  
  @@map("email_unsubscribes")
}
```

## Email Service Implementation

### EmailService Class
```typescript
class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  
  async sendEmail(options: EmailOptions): Promise<EmailResult>
  async sendBulkEmails(emails: EmailOptions[]): Promise<BulkEmailResult>
  async queueEmail(options: EmailOptions, scheduledFor?: Date): Promise<void>
  async processQueue(): Promise<void>
  async verifyConnection(): Promise<boolean>
}
```

### TemplateRenderer
```typescript
class TemplateRenderer {
  static render(template: string, variables: Record<string, any>): string
  static renderWithTracking(template: string, variables: Record<string, any>, trackingId: string): string
  static extractVariables(template: string): string[]
  static validateVariables(template: string, variables: Record<string, any>): boolean
}
```

### TrackingService
```typescript
class TrackingService {
  static generateTrackingId(): string
  static generateTrackingPixel(trackingId: string): string
  static wrapLinksWithTracking(html: string, trackingId: string): string
  static recordOpen(trackingId: string, metadata: TrackingMetadata): Promise<void>
  static recordClick(trackingId: string, url: string, metadata: TrackingMetadata): Promise<void>
}
```

## Email Tracking Implementation

### Open Tracking
- Insert 1x1 transparent pixel at end of email HTML
- Pixel URL: `https://crm.example.com/api/email/track/open/{trackingId}`
- When pixel loads, record open event with IP, user agent, timestamp

### Click Tracking
- Replace all links in email with tracking URLs
- Tracking URL: `https://crm.example.com/api/email/track/click/{trackingId}?url={encodedOriginalUrl}`
- When clicked, record click event and redirect to original URL

## Email Queue Processing

### Background Job
- Run every 1 minute via cron or scheduled task
- Process pending emails in batches of 50
- Implement exponential backoff for retries
- Update email status in database

### Rate Limiting
- Limit to 100 emails per minute (configurable)
- Prevent spam and respect SMTP provider limits
- Queue excess emails for next batch

## Environment Variables

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email Settings
EMAIL_FROM_ADDRESS=noreply@vyntrize.com
EMAIL_FROM_NAME=Vyntrize CRM
EMAIL_REPLY_TO=support@vyntrize.com

# Tracking
EMAIL_TRACKING_DOMAIN=https://crm.vyntrize.com
EMAIL_TRACKING_ENABLED=true

# Queue Settings
EMAIL_QUEUE_BATCH_SIZE=50
EMAIL_QUEUE_RATE_LIMIT=100
EMAIL_QUEUE_MAX_RETRIES=3
```

## UI Components

### EmailComposer Modal
- Template selector dropdown
- Subject line input
- Rich text editor for body
- Variable insertion buttons
- Preview mode
- Send/Schedule buttons

### EmailHistory Component
- List of emails sent to contact/lead
- Show subject, date, status
- Open/click indicators
- Click to view full email

### BulkEmailSelector
- Contact list with checkboxes
- Filter controls
- Selected count display
- Bulk actions menu

### EmailCampaignDashboard
- Campaign list with stats
- Create new campaign button
- Campaign detail view with analytics
- Charts for opens/clicks over time

## Security Considerations

1. **Input Validation**
   - Validate all email addresses
   - Sanitize HTML content
   - Prevent email header injection

2. **Rate Limiting**
   - Limit emails per user per hour
   - Prevent bulk email abuse
   - Implement CAPTCHA for high-volume sends

3. **Unsubscribe Compliance**
   - Include unsubscribe link in all bulk emails
   - Honor unsubscribe requests immediately
   - Store unsubscribe list

4. **Data Privacy**
   - Don't log sensitive email content
   - Encrypt SMTP credentials
   - Comply with GDPR/CAN-SPAM

## Performance Optimization

1. **Email Queue**
   - Process emails asynchronously
   - Batch database operations
   - Use connection pooling

2. **Tracking**
   - Cache tracking pixel responses
   - Use CDN for tracking endpoints
   - Minimize database writes

3. **Templates**
   - Cache rendered templates
   - Pre-compile template variables
   - Optimize HTML size
