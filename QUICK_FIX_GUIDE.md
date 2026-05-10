# Quick Fix Guide for Remaining Pages

## Pattern Replacements

Use these find-and-replace patterns to quickly fix remaining pages:

### 1. Main Container Background
**Find:** `className="... bg-white dark:bg-[#0d1117]"`  
**Replace:** `style={{ backgroundColor: 'var(--color-bg)' }}`

### 2. Section Backgrounds & Borders
**Find:** `border-slate-100 dark:border-[#21262d] bg-slate-50/40 dark:bg-[#161b22]`  
**Replace:** `style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}`

**Find:** `border-slate-100 dark:border-[#21262d]`  
**Replace:** `style={{ borderBottom: '1px solid var(--color-border)' }}`

### 3. Card/Panel Backgrounds
**Find:** `border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22]`  
**Replace:** `style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}`

### 4. Text Colors
**Find:** `text-slate-900 dark:text-white`  
**Replace:** `style={{ color: 'var(--color-text)' }}`

**Find:** `text-slate-500 dark:text-[#8b949e]`  
**Replace:** `style={{ color: 'var(--color-text-muted)' }}`

**Find:** `text-slate-400 dark:text-[#8b949e]`  
**Replace:** `style={{ color: 'var(--color-text-subtle)' }}`

### 5. Primary Buttons
**Find:**
```tsx
className="... bg-slate-900 dark:bg-[#4B6CF7] ... hover:bg-slate-700 dark:hover:bg-[#3d5ce0]"
```

**Replace:**
```tsx
className="... text-white transition-colors"
style={{ backgroundColor: 'var(--color-primary)' }}
onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-h)'}
onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
```

### 6. Secondary Buttons
**Find:**
```tsx
className="... border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] ... hover:bg-slate-50 dark:hover:bg-[#0d1117]"
```

**Replace:**
```tsx
className="... transition-colors"
style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
```

## Pages Still Needing Fixes

### High Priority:
- [ ] `apps/vyntrize-website/app/about/page.tsx` (partially done - needs completion)
- [ ] `apps/vyntrize-website/app/pricing/page.tsx`
- [ ] `apps/vyntrize-website/app/support/page.tsx`
- [ ] `apps/vyntrize-website/app/services/page.tsx`
- [ ] `apps/vyntrize-website/app/services/*/page.tsx` (all service detail pages)

### Medium Priority:
- [ ] `apps/vyntrize-website/app/work/page.tsx`
- [ ] `apps/vyntrize-website/app/work/[slug]/page.tsx`
- [ ] `apps/vyntrize-website/app/solutions/page.tsx`

### Low Priority (Admin):
- [ ] `apps/vyntrize-website/app/admin/**/*.tsx`

## Testing Checklist

After fixing each page:
1. [ ] View in light mode - check all sections
2. [ ] View in dark mode - check all sections
3. [ ] Test hover states on buttons and links
4. [ ] Check mobile responsiveness
5. [ ] Verify no console errors
6. [ ] Test theme toggle transition

## Common Patterns to Watch For

### Hardcoded Colors to Avoid:
- `bg-white`, `bg-slate-*`, `bg-gray-*`
- `text-slate-*`, `text-gray-*`, `text-white`, `text-black`
- `border-slate-*`, `border-gray-*`
- `hover:bg-slate-*`, `hover:text-slate-*`

### Exceptions (OK to keep):
- Accent colors: `bg-blue-500`, `text-emerald-600`, etc. (for badges, icons)
- Gradients: `bg-gradient-to-r from-blue-600...`
- Opacity modifiers: `bg-white/10`, `text-black/50`

## Quick Test Command

```bash
# Search for remaining hardcoded colors
grep -r "bg-slate-\|text-slate-\|border-slate-\|bg-white\|text-white" apps/vyntrize-website/app --include="*.tsx" | grep -v "node_modules"
```

## CSS Variables Reference

```css
/* Backgrounds */
--color-bg           /* Main background */
--color-surface      /* Card/panel background */
--color-raised       /* Elevated surface */

/* Text */
--color-text         /* Primary text */
--color-text-muted   /* Secondary text */
--color-text-subtle  /* Tertiary text */

/* Interactive */
--color-primary      /* Primary button/link */
--color-primary-h    /* Primary hover */

/* Borders */
--color-border       /* Standard border */
--color-border-muted /* Subtle border */
```
