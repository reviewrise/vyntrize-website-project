# Email System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Configure SMTP (2 minutes)

Edit `apps/vyntrize-crm/.env`:

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
1. Go to https://myaccount.google.com/apppasswords
2. Generate an App Password
3. Use it in `SMTP_PASSWORD`

### Step 2: Restart Application (1 minute)

```bash
cd apps/vyntrize-crm
npm run dev
```

### Step 3: Send Your First Email (2 minutes)

1. Navigate to **Contacts**
2. Click on any contact
3. Click **"Send Email"** button
4. Compose your email
5. Click **"Send Email"**
6. ✅ Done! Check your inbox

---

## 📧 Common Tasks

### Send Individual Email
1. Go to contact or lead detail page
2. Click "Send Email"
3. Compose and send

### Send Bulk Email
1. Go to Contacts page
2. Select contacts with checkboxes
3. Click "Send Email (X)"
4. Enter campaign name
5. Compose and send

### View Campaign Stats
1. Click "Campaigns" in sidebar
2. Click on any campaign
3. View stats and recipients

### Use Templates
1. Select template in email composer
2. Subject and body auto-fill
3. Variables are replaced automatically

---

## 🎯 Key Features

- ✅ Individual emails to contacts/leads
- ✅ Bulk campaigns with personalization
- ✅ Open and click tracking
- ✅ Email history with stats
- ✅ Campaigns dashboard
- ✅ Template support
- ✅ Variable substitution
- ✅ Unsubscribe management

---

## 📊 Where to Find Things

- **Send Email**: Contact/Lead detail pages
- **Bulk Email**: Contacts list (select multiple)
- **Email History**: Contact/Lead detail pages (scroll down)
- **Campaigns**: Sidebar → Campaigns
- **Templates**: Sidebar → Email Templates

---

## 🔧 Troubleshooting

**Emails not sending?**
- Check SMTP settings in `.env`
- For Gmail, use App Password (not regular password)
- Restart the application

**Tracking not working?**
- Opens may be blocked by email clients (normal)
- Clicks should always work
- Check EmailEvent table in database

**Need help?**
- See USER_GUIDE.md for detailed instructions
- See API_DOCUMENTATION.md for API reference
- See SMTP_SETUP_GUIDE.md for SMTP help

---

## 📚 Full Documentation

- **USER_GUIDE.md** - Complete user guide
- **API_DOCUMENTATION.md** - API reference
- **SMTP_SETUP_GUIDE.md** - SMTP configuration
- **PROJECT_COMPLETE.md** - Full feature list

---

**That's it! You're ready to send emails! 🎉**
