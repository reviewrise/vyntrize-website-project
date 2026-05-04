# Email System API Documentation

## Authentication
All endpoints require authentication via iron-session. Include session cookie in requests.

---

## Send Individual Email

**POST** `/api/email/send`

Send an email to a single recipient.

### Request Body
```json
{
  "to": "recipient@example.com",
  "toName": "John Doe",
  "subject": "Hello from Vyntrize",
  "body": "<h1>Hello!</h1><p>This is a test email.</p>",
  "templateId": 1,  // Optional: use template instead of body
  "templateVariables": {  // Optional: variables for template
    "firstName": "John",
    "companyName": "Acme Corp"
  },
  "contactId": "contact_id",  // Optional
  "leadId": "lead_id",  // Optional
  "replyTo": "sales@vyntrize.com"  // Optional
}
```

### Response
```json
{
  "success": true,
  "emailId": "email_log_id",
  "trackingId": "trk_123456789_abc",
  "messageId": "<message-id@smtp.server>"
}
```

---

## Send Bulk Email

**POST** `/api/email/bulk`

Send emails to multiple recipients (campaign).

### Request Body
```json
{
  "campaignName": "Monthly Newsletter",
  "subject": "Newsletter - {{month}}",
  "body": "<h1>Hello {{firstName}}!</h1>",
  "templateId": 1,  // Optional
  "recipients": [
    {
      "email": "user1@example.com",
      "name": "User One",
      "contactId": "contact_1",
      "variables": {
        "firstName": "User",
        "month": "January"
      }
    },
    {
      "email": "user2@example.com",
      "name": "User Two",
      "leadId": "lead_1",
      "variables": {
        "firstName": "User",
        "month": "January"
      }
    }
  ],
  "scheduledAt": "2026-05-10T10:00:00Z"  // Optional: schedule for later
}
```

### Response
```json
{
  "success": true,
  "campaignId": "campaign_id",
  "status": "sent",  // or "scheduled"
  "totalRecipients": 2,
  "sent": 2,
  "failed": 0,
  "skipped": 0,  // unsubscribed emails
  "errors": []  // array of {email, error} if any failed
}
```

---

## Get Email History

**GET** `/api/email/history/[id]?type=contact&page=1&limit=20`

Get email history for a contact or lead.

### Query Parameters
- `type`: `contact` or `lead` (default: `contact`)
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `20`)

### Response
```json
{
  "emails": [
    {
      "id": "email_id",
      "subject": "Hello",
      "toEmail": "user@example.com",
      "toName": "User Name",
      "status": "OPENED",
      "sentAt": "2026-05-04T10:00:00Z",
      "openedAt": "2026-05-04T10:05:00Z",
      "clickedAt": null,
      "openCount": 3,
      "clickCount": 0,
      "template": {
        "id": 1,
        "name": "Welcome Email"
      },
      "sentBy": {
        "id": "user_id",
        "displayName": "Sales Rep",
        "email": "sales@vyntrize.com"
      },
      "events": [
        {
          "id": 1,
          "eventType": "OPENED",
          "createdAt": "2026-05-04T10:05:00Z",
          "eventData": {
            "ipAddress": "192.168.1.1",
            "userAgent": "Mozilla/5.0..."
          }
        }
      ],
      "trackingId": "trk_123456789_abc"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "stats": {
    "total": 45,
    "sent": 45,
    "opened": 30,
    "clicked": 15,
    "bounced": 0,
    "failed": 0
  }
}
```

---

## List Campaigns

**GET** `/api/email/campaigns?page=1&limit=20&status=SENT`

Get list of email campaigns.

### Query Parameters
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `20`)
- `status`: Filter by status (optional): `DRAFT`, `SCHEDULED`, `SENDING`, `SENT`, `FAILED`, `CANCELLED`

### Response
```json
{
  "campaigns": [
    {
      "id": "campaign_id",
      "name": "Monthly Newsletter",
      "subject": "Newsletter - January",
      "status": "SENT",
      "createdAt": "2026-05-01T10:00:00Z",
      "scheduledAt": null,
      "sentAt": "2026-05-01T10:05:00Z",
      "stats": {
        "totalRecipients": 100,
        "sent": 100,
        "delivered": 98,
        "opened": 65,
        "clicked": 25,
        "bounced": 2,
        "failed": 0,
        "openRate": "65.00",
        "clickRate": "25.00"
      },
      "template": {
        "id": 1,
        "name": "Newsletter Template"
      },
      "createdBy": {
        "id": "user_id",
        "displayName": "Marketing Manager",
        "email": "marketing@vyntrize.com"
      },
      "emailCount": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

## Get Campaign Details

**GET** `/api/email/campaigns/[id]`

Get detailed information about a campaign.

### Response
```json
{
  "campaign": {
    "id": "campaign_id",
    "name": "Monthly Newsletter",
    "subject": "Newsletter - January",
    "status": "SENT",
    "createdAt": "2026-05-01T10:00:00Z",
    "scheduledAt": null,
    "sentAt": "2026-05-01T10:05:00Z",
    "targetType": "manual",
    "targetFilter": null,
    "stats": {
      "totalRecipients": 100,
      "sent": 100,
      "delivered": 98,
      "opened": 65,
      "clicked": 25,
      "bounced": 2,
      "failed": 0,
      "openRate": "65.00",
      "clickRate": "25.00",
      "bounceRate": "2.00"
    },
    "template": {
      "id": 1,
      "name": "Newsletter Template",
      "subject": "Newsletter - {{month}}",
      "body": "<h1>Hello {{firstName}}!</h1>"
    },
    "createdBy": {
      "id": "user_id",
      "displayName": "Marketing Manager",
      "email": "marketing@vyntrize.com"
    },
    "emails": [
      {
        "id": "email_id",
        "toEmail": "user@example.com",
        "toName": "User Name",
        "status": "OPENED",
        "sentAt": "2026-05-01T10:05:00Z",
        "openedAt": "2026-05-01T10:10:00Z",
        "clickedAt": null,
        "openCount": 2,
        "clickCount": 0
      }
    ]
  }
}
```

---

## Update Campaign

**PATCH** `/api/email/campaigns/[id]`

Update campaign details (limited fields).

### Request Body
```json
{
  "name": "Updated Campaign Name",
  "status": "CANCELLED",
  "scheduledAt": "2026-05-10T10:00:00Z"
}
```

### Response
```json
{
  "success": true,
  "campaign": {
    "id": "campaign_id",
    "name": "Updated Campaign Name",
    "status": "CANCELLED",
    ...
  }
}
```

---

## Delete Campaign

**DELETE** `/api/email/campaigns/[id]`

Delete a campaign (cannot delete campaigns that are currently sending).

### Response
```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

---

## Track Email Open

**GET** `/api/email/track/open/[trackingId]`

Track when an email is opened. Returns a 1x1 transparent GIF pixel.

This endpoint is called automatically when the tracking pixel in the email is loaded.

### Response
- Content-Type: `image/gif`
- Body: 1x1 transparent GIF

---

## Track Email Click

**GET** `/api/email/track/click/[trackingId]?url=https://example.com`

Track when a link in an email is clicked. Redirects to the original URL.

### Query Parameters
- `url`: The original URL to redirect to (required)

### Response
- HTTP 302 Redirect to the original URL

---

## Unsubscribe

**POST** `/api/email/unsubscribe`

Unsubscribe an email address from all marketing emails.

### Request Body
```json
{
  "email": "user@example.com",
  "reason": "No longer interested"  // Optional
}
```

### Response
```json
{
  "success": true,
  "message": "Successfully unsubscribed"
}
```

**GET** `/api/email/unsubscribe?email=user@example.com`

Unsubscribe via email link. Returns an HTML confirmation page.

### Query Parameters
- `email`: Email address to unsubscribe (required)

### Response
- Content-Type: `text/html`
- Body: HTML confirmation page

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

### Common Status Codes
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Email sending is rate-limited based on environment configuration:
- `EMAIL_QUEUE_RATE_LIMIT`: Maximum emails per minute (default: 100)
- `EMAIL_QUEUE_BATCH_SIZE`: Batch size for bulk sends (default: 50)

Bulk email sends are automatically batched and rate-limited to prevent overwhelming the SMTP server.

---

## Email Tracking

### How It Works

1. **Open Tracking**: A 1x1 transparent GIF pixel is inserted at the end of every email. When the recipient's email client loads the image, it makes a request to `/api/email/track/open/[trackingId]`, which records the open event.

2. **Click Tracking**: All links in the email are wrapped with tracking URLs that point to `/api/email/track/click/[trackingId]?url=...`. When clicked, the system records the click and redirects to the original URL.

### Privacy Considerations

- Tracking can be disabled by setting `EMAIL_TRACKING_ENABLED=false`
- IP addresses and user agents are stored for analytics
- Recipients can opt out via unsubscribe links

---

## Template Variables

Templates support the following syntax:

### Simple Variables
```html
Hello {{firstName}} {{lastName}}!
```

### Conditionals
```html
{{#if isPremium}}
  <p>Thank you for being a premium customer!</p>
{{/if}}
```

### Loops
```html
<ul>
{{#each items}}
  <li>{{this}}</li>
{{/each}}
</ul>
```

### Common Variables
- `{{firstName}}` - Contact/Lead first name
- `{{lastName}}` - Contact/Lead last name
- `{{email}}` - Contact/Lead email
- `{{companyName}}` - Company name
- `{{unsubscribeUrl}}` - Unsubscribe link (automatically added)
