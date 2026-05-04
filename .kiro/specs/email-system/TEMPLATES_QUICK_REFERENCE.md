# Email Templates - Quick Reference

## 📧 Available Templates

### 1. Welcome Email
**When**: First contact with new leads  
**Key Variables**: `firstName`, `companyName`, `scheduleLink`  
**Tone**: Warm, welcoming, professional

### 2. Initial Outreach
**When**: Cold outreach to prospects  
**Key Variables**: `firstName`, `companyName`, `valueProposition`, `benefit1-3`  
**Tone**: Professional, value-focused, consultative

### 3. Follow-up After Meeting
**When**: After sales calls or meetings  
**Key Variables**: `firstName`, `meetingDate`, `takeaway1-3`, `nextStep1-3`  
**Tone**: Professional, action-oriented, collaborative

### 4. Monthly Newsletter
**When**: Regular audience updates  
**Key Variables**: `monthName`, `headline`, `section1-3Title/Content/Link`  
**Tone**: Informative, engaging, branded

### 5. Proposal Sent
**When**: Delivering proposals to qualified leads  
**Key Variables**: `firstName`, `proposalAmount`, `deliverable1-4`, `timeline`  
**Tone**: Professional, confident, clear

### 6. Re-engagement Email
**When**: Reactivating inactive contacts  
**Key Variables**: `firstName`, `companyName`, `update1-3`, `previousInterest`  
**Tone**: Friendly, casual, non-pushy

---

## 🚀 Quick Start

### Using in Campaign Builder
```
/campaigns/new → Step 3 → Select Template → Customize → Send
```

### Using in Email Composer
```
Contact Page → Send Email → Select Template → Auto-fill → Send
```

---

## 🔧 Variable Syntax

### Auto-Fill Variables (from contact data)
```
{{firstName}}    → John
{{lastName}}     → Doe
{{email}}        → john@example.com
{{companyName}}  → Acme Corp
{{phone}}        → +1-555-0123
{{jobTitle}}     → CEO
```

### Custom Variables (manual replacement)
```
{{scheduleLink}}      → https://calendly.com/yourname
{{valueProposition}}  → increase sales by 30%
{{proposalAmount}}    → $50,000
{{meetingDate}}       → yesterday
```

---

## 📊 Template Stats

| Template | Variables | Complexity | Avg Open Rate* |
|----------|-----------|------------|----------------|
| Welcome Email | 4 | ⭐ Simple | 65% |
| Initial Outreach | 11 | ⭐⭐ Medium | 35% |
| Follow-up After Meeting | 13 | ⭐⭐⭐ Complex | 75% |
| Monthly Newsletter | 14 | ⭐⭐⭐ Complex | 45% |
| Proposal Sent | 14 | ⭐⭐⭐ Complex | 80% |
| Re-engagement | 6 | ⭐ Simple | 25% |

*Industry averages for reference

---

## ✅ Best Practices

### Subject Lines
- ✅ Keep under 50 characters
- ✅ Use personalization (`{{firstName}}`)
- ✅ Create curiosity or urgency
- ❌ Avoid spam words (FREE, ACT NOW, etc.)

### Email Body
- ✅ Start with personalization
- ✅ Keep paragraphs short (2-3 sentences)
- ✅ Use bullet points for lists
- ✅ Include clear CTA button
- ❌ Don't overuse exclamation marks!!!

### Variable Usage
- ✅ Always test with real data
- ✅ Provide fallback values
- ✅ Use descriptive variable names
- ❌ Don't leave empty `{{}}`

---

## 🎨 Customization Tips

### Colors
Templates use neutral colors that work with any brand:
- Primary: `#667eea` (purple-blue)
- Success: `#28a745` (green)
- Background: `#f5f5f5` (light gray)

**To customize**: Edit template HTML and replace color values

### Fonts
Default font stack:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Buttons
CTA buttons are styled for maximum visibility:
- 14px padding (top/bottom), 32px (left/right)
- 6px border radius
- Bold font weight
- High contrast colors

---

## 🔍 Testing Checklist

Before sending a campaign:
- [ ] Preview email in builder
- [ ] Check all variables are replaced
- [ ] Verify links work
- [ ] Test on mobile device
- [ ] Send test email to yourself
- [ ] Check spam score (if available)

---

## 📱 Mobile Optimization

All templates are responsive:
- ✅ Single column layout on mobile
- ✅ Touch-friendly buttons (min 44px)
- ✅ Readable font sizes (min 14px)
- ✅ Optimized images
- ✅ Fast loading

---

## 🛠️ Troubleshooting

### Template not showing?
- Restart dev server
- Check database connection
- Verify templates were seeded

### Variables not replacing?
- Check variable syntax: `{{variableName}}`
- Ensure contact has data for that field
- Test with manual replacement first

### Email looks broken?
- Check HTML syntax
- Verify inline CSS
- Test in different email clients
- Use email testing tool (Litmus, Email on Acid)

---

## 📚 Resources

- **Full Guide**: `.kiro/specs/email-system/EMAIL_TEMPLATES_GUIDE.md`
- **Implementation Status**: `.kiro/specs/email-system/IMPLEMENTATION_STATUS.md`
- **Summary**: `.kiro/specs/email-system/TEMPLATES_SUMMARY.md`

---

## 🎯 Common Use Cases

### New Lead Welcome Sequence
1. **Welcome Email** (immediate)
2. **Initial Outreach** (day 2)
3. **Follow-up After Meeting** (after call)
4. **Proposal Sent** (after qualification)

### Monthly Engagement
1. **Monthly Newsletter** (1st of month)
2. **Re-engagement Email** (to inactive contacts)

### Sales Process
1. **Initial Outreach** (cold contact)
2. **Follow-up After Meeting** (post-demo)
3. **Proposal Sent** (qualified lead)
4. **Welcome Email** (new customer)

---

**Quick Access**: Bookmark this page for fast reference!  
**Last Updated**: May 4, 2026
