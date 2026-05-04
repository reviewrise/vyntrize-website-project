# Email Templates Guide

## Overview

We've created 6 professional email templates that cover common business communication scenarios. All templates are responsive, beautifully designed, and include variable placeholders for personalization.

## Available Templates

### 1. Welcome Email
**Use Case**: First contact with new leads or customers  
**Subject**: `Welcome to {{companyName}}, {{firstName}}!`

**Variables**:
- `{{firstName}}` - Contact's first name
- `{{companyName}}` - Your company name
- `{{scheduleLink}}` - Link to your scheduling page
- `{{companyAddress}}` - Your company address

**Best For**:
- New contact submissions
- Welcome sequences
- Initial acknowledgment

---

### 2. Initial Outreach
**Use Case**: Cold outreach to potential clients  
**Subject**: `Quick question about {{companyName}}`

**Variables**:
- `{{firstName}}` - Contact's first name
- `{{companyName}}` - Contact's company name
- `{{specificDetail}}` - Something specific about their company
- `{{valueProposition}}` - How you can help them
- `{{similarCompany}}` - Similar company you've helped
- `{{benefit1}}`, `{{benefit2}}`, `{{benefit3}}` - Three key benefits
- `{{calendarLink}}` - Calendar booking link
- `{{senderName}}` - Your name
- `{{senderTitle}}` - Your title

**Best For**:
- Cold email campaigns
- Lead generation
- Business development

---

### 3. Follow-up After Meeting
**Use Case**: Post-meeting follow-up with action items  
**Subject**: `Great connecting with you, {{firstName}}!`

**Variables**:
- `{{firstName}}` - Contact's first name
- `{{meetingDate}}` - When the meeting occurred
- `{{companyName}}` - Company name
- `{{specificGoal}}` - Their specific goal discussed
- `{{takeaway1}}`, `{{takeaway2}}`, `{{takeaway3}}` - Key takeaways
- `{{nextStep1}}`, `{{nextStep2}}`, `{{nextStep3}}` - Next steps
- `{{attachmentDescription}}` - What you're attaching
- `{{senderName}}` - Your name
- `{{senderTitle}}` - Your title

**Best For**:
- Meeting follow-ups
- Proposal preparation
- Relationship building

---

### 4. Monthly Newsletter
**Use Case**: Regular updates to your audience  
**Subject**: `{{monthName}} Newsletter: {{headline}}`

**Variables**:
- `{{companyName}}` - Your company name
- `{{monthName}}` - Current month
- `{{year}}` - Current year
- `{{headline}}` - Newsletter main headline
- `{{subheadline}}` - Supporting headline
- `{{section1Title}}`, `{{section1Content}}`, `{{section1Link}}` - First article
- `{{section2Title}}`, `{{section2Content}}`, `{{section2Link}}` - Second article
- `{{section3Title}}`, `{{section3Content}}`, `{{section3Link}}` - Third article
- `{{companyAddress}}` - Company address

**Best For**:
- Monthly updates
- Content marketing
- Engagement campaigns

---

### 5. Proposal Sent
**Use Case**: Sending proposals to qualified leads  
**Subject**: `Your custom proposal from {{companyName}}`

**Variables**:
- `{{firstName}}` - Contact's first name
- `{{companyName}}` - Company name
- `{{projectDescription}}` - Brief project description
- `{{proposalAmount}}` - Investment amount
- `{{proposalLink}}` - Link to full proposal
- `{{deliverable1}}`, `{{deliverable2}}`, `{{deliverable3}}`, `{{deliverable4}}` - What's included
- `{{timeline}}` - Project timeline
- `{{desiredOutcome}}` - What they'll achieve
- `{{meetingLink}}` - Link to schedule review call
- `{{senderName}}` - Your name
- `{{senderTitle}}` - Your title

**Best For**:
- Proposal delivery
- Quote follow-ups
- Sales closing

---

### 6. Re-engagement Email
**Use Case**: Re-engaging inactive contacts  
**Subject**: `We miss you, {{firstName}}!`

**Variables**:
- `{{firstName}}` - Contact's first name
- `{{companyName}}` - Company name
- `{{update1}}`, `{{update2}}`, `{{update3}}` - Recent updates
- `{{previousInterest}}` - What they were interested in
- `{{reconnectLink}}` - Link to reconnect

**Best For**:
- Win-back campaigns
- Dormant lead reactivation
- Relationship renewal

---

## How to Use Templates

### In Campaign Builder

1. Go to `/campaigns/new`
2. In Step 3 (Content), select a template from the dropdown
3. The subject and body will auto-populate
4. Replace variable placeholders with actual values or use the variable syntax for personalization
5. Preview and send

### In Email Composer

1. Open a contact or lead detail page
2. Click "Send Email"
3. Select a template from the dropdown
4. Variables will be auto-filled based on contact data
5. Customize as needed and send

### Variable Replacement

Templates support automatic variable replacement:

```
{{firstName}} → John
{{companyName}} → Acme Corp
{{email}} → john@acme.com
```

**Available Auto-Fill Variables**:
- `{{firstName}}` - From contact record
- `{{lastName}}` - From contact record
- `{{email}}` - From contact record
- `{{companyName}}` - From company record
- `{{phone}}` - From contact record
- `{{jobTitle}}` - From contact record

**Custom Variables**:
You can add any custom variable in the format `{{variableName}}` and replace it manually or programmatically.

---

## Template Design Features

### Responsive Design
All templates are mobile-responsive and look great on:
- Desktop email clients (Outlook, Apple Mail, Thunderbird)
- Web email (Gmail, Yahoo, Outlook.com)
- Mobile devices (iOS Mail, Android Gmail)

### Professional Styling
- Clean, modern design
- Consistent typography
- Brand-friendly color scheme
- Clear call-to-action buttons
- Proper spacing and hierarchy

### Email Client Compatibility
- Inline CSS for maximum compatibility
- Table-based layout for older clients
- Fallback fonts
- Safe color palette

---

## Customization

### Editing Templates

Templates can be edited in the CRM:
1. Go to `/email-templates` (coming soon)
2. Select a template
3. Edit subject, body, or variables
4. Save changes

### Creating New Templates

You can create new templates by:
1. Using the template editor UI (coming soon)
2. Adding to the seed script (`seed-email-templates.ts`)
3. Using the API endpoint `/api/email/templates`

### Template Variables Schema

```typescript
{
  name: string;              // Template name
  subject: string;           // Email subject with {{variables}}
  body: string;              // HTML email body
  variables: {               // Variable definitions
    [key: string]: string;   // variableName: description
  };
  isShared: boolean;         // Available to all users
  userId?: string;           // Owner (null for shared)
}
```

---

## Best Practices

### Subject Lines
- Keep under 50 characters
- Use personalization (`{{firstName}}`)
- Create urgency or curiosity
- Avoid spam trigger words

### Email Body
- Start with personalization
- Keep paragraphs short (2-3 sentences)
- Use bullet points for lists
- Include clear call-to-action
- Add unsubscribe link (auto-added by system)

### Variable Usage
- Always provide fallback values
- Test with different data sets
- Use conditional logic for optional fields
- Keep variable names descriptive

### Testing
- Send test emails before campaigns
- Check on multiple devices
- Verify all links work
- Test variable replacement

---

## Seeding Templates

To seed the templates into your database:

```bash
# From root directory
VYNTRIZE_DATABASE_URL="your-db-url" npx tsx packages/@platform/vyntrize-db/scripts/seed-email-templates.ts

# Or using the npm script
cd packages/@platform/vyntrize-db
npm run seed:templates
```

**Note**: Templates are created as shared (available to all users) and assigned to the first admin user found.

---

## Template Analytics

Each template tracks:
- Times used
- Open rates
- Click rates
- Conversion rates
- Best performing variations

View template performance in the campaigns dashboard at `/campaigns`.

---

## Future Enhancements

### Planned Features
- [ ] Visual template editor
- [ ] Template categories and tags
- [ ] A/B testing support
- [ ] Template marketplace
- [ ] AI-powered suggestions
- [ ] Dynamic content blocks
- [ ] Conditional sections
- [ ] Multi-language support

---

## Support

For questions or issues with email templates:
1. Check this guide first
2. Review the email system documentation
3. Test in the campaign builder
4. Contact your system administrator

---

**Last Updated**: May 4, 2026  
**Version**: 1.0.0
