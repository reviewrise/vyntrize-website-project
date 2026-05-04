# SMTP Setup Guide

This guide will help you configure SMTP for sending emails from the CRM.

## Gmail Setup (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to App Passwords: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Vyntrize CRM" as the name
4. Click "Generate"
5. Copy the 16-character password

### Step 3: Configure .env
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="xxxx xxxx xxxx xxxx"  # The app password from step 2
EMAIL_FROM_ADDRESS="your-email@gmail.com"
EMAIL_FROM_NAME="Your Name"
```

### Gmail Limitations
- **Free Gmail**: 500 emails per day
- **Google Workspace**: 2,000 emails per day

---

## Outlook/Office 365 Setup

### Configuration
```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@outlook.com"
SMTP_PASSWORD="your-password"
EMAIL_FROM_ADDRESS="your-email@outlook.com"
EMAIL_FROM_NAME="Your Name"
```

### Outlook Limitations
- **Free Outlook**: 300 emails per day
- **Office 365**: Varies by plan (typically 10,000 per day)

---

## Custom SMTP Server

If you have your own SMTP server or use a service like SendGrid, Mailgun, etc.:

```env
SMTP_HOST="smtp.your-server.com"
SMTP_PORT="587"                    # or 465 for SSL
SMTP_SECURE="false"                # true for port 465
SMTP_USER="your-username"
SMTP_PASSWORD="your-password"
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Company"
```

---

## SendGrid (Alternative)

SendGrid offers a generous free tier (100 emails/day) and is designed for transactional emails.

### Setup
1. Sign up at https://sendgrid.com/
2. Create an API key
3. Configure:

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"                 # Literally the word "apikey"
SMTP_PASSWORD="SG.xxxxxxxxxxxxx"   # Your SendGrid API key
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Company"
```

---

## Testing Your Configuration

### Method 1: Using the CRM
1. Start the CRM: `pnpm dev:crm`
2. Navigate to a contact or lead
3. Click "Send Email"
4. Send a test email to yourself

### Method 2: Using Node.js Script
Create `test-email.ts`:

```typescript
import { emailService } from './apps/vyntrize-crm/lib/email/email-service';

async function testEmail() {
  // Verify connection
  const connected = await emailService.verifyConnection();
  console.log('SMTP Connection:', connected ? 'SUCCESS' : 'FAILED');

  if (!connected) {
    console.error('Check your SMTP configuration in .env');
    return;
  }

  // Send test email
  const result = await emailService.sendEmail({
    to: 'your-email@example.com',
    subject: 'Test Email from Vyntrize CRM',
    html: '<h1>Hello!</h1><p>This is a test email.</p>',
  });

  console.log('Send Result:', result);
}

testEmail();
```

Run: `npx tsx test-email.ts`

---

## Troubleshooting

### "Authentication failed"
- **Gmail**: Make sure you're using an App Password, not your regular password
- **Outlook**: Check if "Less secure app access" is enabled (if using regular password)
- **All**: Verify username and password are correct

### "Connection timeout"
- Check your firewall settings
- Verify the SMTP host and port are correct
- Try using port 465 with `SMTP_SECURE="true"`

### "Sender address rejected"
- Make sure `EMAIL_FROM_ADDRESS` matches your SMTP_USER
- For custom domains, verify SPF and DKIM records are set up

### "Daily limit exceeded"
- You've hit your provider's daily sending limit
- Wait 24 hours or upgrade your plan
- Consider using a dedicated email service (SendGrid, Mailgun, etc.)

---

## Production Recommendations

For production use, we recommend:

1. **Use a dedicated email service** (SendGrid, Mailgun, Amazon SES)
   - Better deliverability
   - Higher sending limits
   - Built-in bounce handling
   - Detailed analytics

2. **Set up SPF, DKIM, and DMARC records**
   - Improves email deliverability
   - Prevents emails from going to spam
   - Protects your domain from spoofing

3. **Use a dedicated sending domain**
   - e.g., `noreply@mail.yourdomain.com`
   - Keeps your main domain reputation safe

4. **Monitor bounce rates**
   - Keep bounce rate below 5%
   - Remove invalid email addresses
   - Respect unsubscribe requests

---

## Security Best Practices

1. **Never commit SMTP credentials to git**
   - Always use environment variables
   - Add `.env` to `.gitignore`

2. **Use App Passwords instead of regular passwords**
   - More secure
   - Can be revoked without changing your main password

3. **Enable rate limiting**
   - Prevents abuse
   - Protects your SMTP account from being flagged

4. **Validate email addresses before sending**
   - Reduces bounce rate
   - Saves on sending quota

5. **Include unsubscribe links**
   - Required by law (CAN-SPAM, GDPR)
   - Improves sender reputation
