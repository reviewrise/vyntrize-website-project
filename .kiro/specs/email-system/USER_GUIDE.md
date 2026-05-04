# Email System - User Guide

## Quick Start

### 1. Configure SMTP Settings

Before sending emails, configure your SMTP server in `apps/vyntrize-crm/.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM_ADDRESS="noreply@vyntrize.com"
EMAIL_FROM_NAME="Vyntrize CRM"
```

**For Gmail:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to https://myaccount.google.com/apppasswords
4. Generate an App Password for "Mail"
5. Use the 16-character app password in `SMTP_PASSWORD`

**For Outlook/Office 365:**
```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASSWORD="your-password"
```

### 2. Restart the Application

After configuring SMTP, restart your development server:

```bash
cd apps/vyntrize-crm
npm run dev
```

## Features

### Send Individual Emails

#### From Contact Detail Page
1. Navigate to **Contacts** → Click on a contact
2. Click the **"Send Email"** button in the top-right
3. The email composer modal opens with:
   - Recipient email pre-filled
   - Recipient name pre-filled
   - Template selector (optional)
   - Subject field
   - Body field (HTML supported)
4. Compose your email
5. Click **"Send Email"**
6. Email is sent immediately
7. View the email in the **Email History** section below

#### From Lead Detail Page
1. Navigate to **Pipeline** → Click on a lead
2. Click the **"Send Email"** button in the top-right
3. Follow the same steps as above

### Send Bulk Emails

1. Navigate to **Contacts**
2. Select contacts using the checkboxes:
   - Click individual checkboxes to select specific contacts
   - Click the header checkbox to select all contacts on the page
3. Click **"Send Email (X)"** button that appears
4. The bulk email composer modal opens showing:
   - List of selected recipients
   - Campaign name field (required)
   - Template selector (optional)
   - Subject field
   - Body field (HTML supported)
5. Enter a campaign name (e.g., "Monthly Newsletter - January 2026")
6. Compose your email
7. Click **"Send to X Recipients"**
8. Campaign is created and emails are queued
9. Emails are sent in the background

### View Email History

#### For Contacts
1. Navigate to **Contacts** → Click on a contact
2. Scroll down to the **"Email History"** section
3. View:
   - Total emails sent
   - Open rate and count
   - Click rate and count
   - Failed emails
   - List of all emails with status icons

#### For Leads
1. Navigate to **Pipeline** → Click on a lead
2. Scroll down to the **"Email History"** section
3. View the same stats as above

### Use Email Templates

1. Navigate to **Email Templates** (if available)
2. Create templates with:
   - Template name
   - Subject line
   - Body (HTML)
   - Variables: `{{firstName}}`, `{{lastName}}`, `{{companyName}}`
3. When composing an email:
   - Select a template from the dropdown
   - Subject and body are auto-filled
   - Variables are replaced with actual values

## Email Features

### Variable Substitution

Use these variables in your email subject and body:

- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name
- `{{companyName}}` - Contact's company name
- `{{email}}` - Contact's email address

**Example:**
```html
<p>Hi {{firstName}},</p>
<p>I hope this email finds you well at {{companyName}}.</p>
```

### HTML Support

You can use HTML in the email body:

```html
<h1>Welcome!</h1>
<p>This is a <strong>bold</strong> statement.</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
<a href="https://example.com">Click here</a>
```

### Email Tracking

All emails are automatically tracked:

- **Opens**: A tracking pixel records when the email is opened
- **Clicks**: All links are wrapped to track clicks
- **Status**: Sent, Opened, Clicked, Bounced, Failed

View tracking stats in the Email History section.

### Unsubscribe

All bulk emails automatically include an unsubscribe link at the bottom. When a recipient unsubscribes:
- They are added to the unsubscribe list
- Future bulk emails will skip them
- Individual emails can still be sent (manual override)

## Email Status Icons

In the Email History section, you'll see these status icons:

- 📧 **Gray envelope** - Email sent, not yet opened
- 📬 **Blue envelope** - Email opened (shows open count)
- 🖱️ **Green cursor** - Email clicked (shows click count)
- ⚠️ **Red warning** - Email bounced or failed

## Best Practices

### Individual Emails
- Use for personal, one-on-one communication
- Personalize the message for the recipient
- Include a clear call-to-action
- Keep it concise and relevant

### Bulk Emails
- Use for newsletters, announcements, promotions
- Always use variables for personalization
- Test with a small group first
- Include an unsubscribe link (automatic)
- Monitor open and click rates
- Follow email marketing best practices

### Templates
- Create templates for common email types
- Use clear, descriptive names
- Include variables for personalization
- Test templates before using in campaigns
- Keep templates up-to-date

### Tracking
- Monitor open rates to gauge interest
- Track click rates to measure engagement
- Review failed emails and update contact info
- Use stats to improve future campaigns

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration**
   - Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` in `.env`
   - For Gmail, ensure you're using an App Password, not your regular password
   - Restart the application after changing `.env`

2. **Check Email Logs**
   - Look for error messages in the browser console
   - Check the server logs for SMTP errors
   - Verify the recipient email address is valid

3. **Test SMTP Connection**
   - Try sending a test email from the contact detail page
   - Check if the email appears in your sent folder
   - Verify the email is received

### Tracking Not Working

1. **Opens Not Tracking**
   - Tracking pixels may be blocked by email clients
   - Some email clients don't load images by default
   - This is normal and expected for some recipients

2. **Clicks Not Tracking**
   - Verify links are being wrapped (check email source)
   - Check if the tracking URL is accessible
   - Review EmailEvent records in the database

### Bulk Emails Slow

- Bulk emails are sent one at a time to avoid rate limiting
- Large campaigns may take several minutes
- Consider implementing the Email Queue (Phase 3) for better performance
- Monitor SMTP rate limits from your provider

## API Endpoints

For developers integrating with the email system:

### Send Individual Email
```
POST /api/email/send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "toName": "John Doe",
  "subject": "Hello",
  "body": "<p>Hi {{firstName}},</p>",
  "contactId": "contact-id",
  "leadId": "lead-id",
  "templateId": 1
}
```

### Send Bulk Email
```
POST /api/email/bulk
Content-Type: application/json

{
  "campaignName": "Monthly Newsletter",
  "subject": "Newsletter - January 2026",
  "body": "<p>Hi {{firstName}},</p>",
  "recipients": [
    {
      "contactId": "contact-1",
      "email": "user1@example.com",
      "name": "User One",
      "variables": {
        "firstName": "User",
        "lastName": "One",
        "companyName": "Company A"
      }
    }
  ]
}
```

### Get Email History
```
GET /api/email/history/{id}?type=contact&page=1&limit=10
```

### Track Email Open
```
GET /api/email/track/open/{trackingId}
```

### Track Email Click
```
GET /api/email/track/click/{trackingId}?url={originalUrl}
```

## Support

For issues or questions:
1. Check this user guide
2. Review the API documentation in `.kiro/specs/email-system/API_DOCUMENTATION.md`
3. Check the SMTP setup guide in `.kiro/specs/email-system/SMTP_SETUP_GUIDE.md`
4. Review the implementation status in `.kiro/specs/email-system/IMPLEMENTATION_STATUS.md`
