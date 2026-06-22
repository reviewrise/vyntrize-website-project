/**
 * email-layout.ts
 *
 * Provides the canonical branded header + footer wrapper for every outgoing
 * email sent through the CRM. The layout is assembled from:
 *
 *   • Company settings  (logo, name, website, address)  — SystemSetting: COMPANY_PROFILE
 *   • Sending user profile  (name, title, email, phone, role)  — CrmUser row
 *
 * The footer contact block mirrors the vCard format used on business cards:
 *   name / title / direct email / dept email (role-mapped) / website
 *
 * Usage:
 *   import { wrapWithEmailLayout } from '@/lib/email/email-layout';
 *   const wrappedHtml = await wrapWithEmailLayout(rawHtml, { userId, trackingId });
 */

import { prisma } from '@/lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SenderProfile {
  displayName: string;
  jobTitle?: string | null;
  email: string;
  phone?: string | null;
  role: string; // CrmRole enum value as string
  bookingSlug?: string | null;
}

export interface CompanyBranding {
  name: string;
  logoUrl: string;
  website: string;
  address: string;
  email: string;
}

export interface LayoutOptions {
  /** CRM user ID of the sender — used to personalise the footer */
  userId?: string;
  /** Tracking pixel/link ID — forwarded to TemplateRenderer if needed */
  trackingId?: string;
  /** Pre-fetched sender profile (skips DB lookup) */
  senderProfile?: SenderProfile;
  /** Pre-fetched company branding (skips DB lookup) */
  companyBranding?: CompanyBranding;
}

// ─── Role → dept email mapping ────────────────────────────────────────────────

/**
 * Maps a CrmRole value to the appropriate department email address.
 * Mirrors the contact block from the company vCard:
 *   sales@… / support@… / billing@… / info@…
 */
function getDeptEmail(role: string, companyDomain: string): { label: string; address: string } {
  const domain = companyDomain || 'vyntrise.com';
  switch (role.toLowerCase()) {
    case 'admin':
      return { label: 'Business inquiries', address: `info@${domain}` };
    case 'sales':
      return { label: 'New clients', address: `sales@${domain}` };
    case 'support':
      return { label: 'Customer help', address: `support@${domain}` };
    case 'billing':
      return { label: 'Invoices & payments', address: `billing@${domain}` };
    default:
      return { label: 'Contact', address: `info@${domain}` };
  }
}

/** Extract bare domain from a URL string (e.g. "https://vyntrise.com" → "vyntrise.com") */
function extractDomain(websiteUrl: string): string {
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, '');
  } catch {
    return websiteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

// ─── DB loaders ───────────────────────────────────────────────────────────────

async function loadCompanyBranding(): Promise<CompanyBranding> {
  const defaults: CompanyBranding = {
    name: 'VyntRise',
    logoUrl: '/images/logo.png',
    website: 'https://vyntrise.com',
    address: '',
    email: 'info@vyntrise.com',
  };

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'COMPANY_PROFILE' },
    });
    if (setting?.value) {
      const v = setting.value as Record<string, string>;
      return {
        name: v.name || defaults.name,
        logoUrl: v.logoUrl || defaults.logoUrl,
        website: v.website || defaults.website,
        address: v.address || defaults.address,
        email: v.email || defaults.email,
      };
    }
  } catch {
    // fall through to defaults
  }
  return defaults;
}

async function loadSenderProfile(userId: string): Promise<SenderProfile | null> {
  try {
    const user = await prisma.crmUser.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        email: true,
        role: true,
        jobTitle: true,
        phone: true,
        bookingSlug: true,
      },
    });
    if (!user) return null;
    return {
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      jobTitle: user.jobTitle,
      phone: user.phone,
      bookingSlug: user.bookingSlug,
    };
  } catch {
    return null;
  }
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

/**
 * Builds the full branded email HTML from raw body content.
 * This is a pure function — no DB calls happen here.
 */
export function buildEmailLayout(
  bodyHtml: string,
  company: CompanyBranding,
  sender?: SenderProfile | null,
  trackingId?: string
): string {
  // Build the tracking pixel URL (if tracking is configured)
  let trackingDomain =
    process.env.EMAIL_TRACKING_DOMAIN ||
    process.env.NEXT_PUBLIC_CRM_URL ||
    'https://crm.vyntrise.com';
  if (!trackingDomain.startsWith('http://') && !trackingDomain.startsWith('https://')) {
    trackingDomain = `https://${trackingDomain}`;
  }
  const trackingPixelTag = trackingId
    ? `<img src="${trackingDomain.replace(/\/$/, '')}/api/email/track/open/${trackingId}" width="1" height="1" border="0" alt="" style="display:block;width:1px;height:1px;border:0;" />`
    : '';
  // Resolve logo: if it's a relative path, make it absolute using the company website.
  const logoSrc = company.logoUrl.startsWith('http')
    ? company.logoUrl
    : `${company.website.replace(/\/$/, '')}${company.logoUrl}`;

  const domain = extractDomain(company.website);
  const deptEmail = sender 
    ? getDeptEmail(sender.role, domain) 
    : { label: 'Contact', address: company.email || `info@${domain}` };

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border-top:4px solid #4f46e5; border-bottom:1px solid #e2e8f0; border-radius:12px 12px 0 0;">
      <tr>
        <td style="padding:24px 32px; text-align:left;">
          <table cellpadding="0" cellspacing="0" style="display:inline-block;">
            <tr>
              <td style="vertical-align:middle;">
                <img
                  src="${logoSrc}"
                  alt="${company.name}"
                  height="36"
                  style="display:block; border:0; outline:none; height:36px; width:auto; max-width:160px;"
                />
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  // ── Footer ──────────────────────────────────────────────────────────────────
  // Left col: sender vCard. Right col: dept contact info.
  const senderBlock = sender
    ? `
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding-bottom:4px;">
            <span style="font-size:15px; font-weight:700; color:#0f172a; display:block;">${sender.displayName}</span>
            ${sender.jobTitle ? `<span style="font-size:12px; color:#64748b; display:block; margin-top:2px;">${sender.jobTitle}</span>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding-top:10px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:5px;">
                  <span style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8;">Direct</span><br>
                  <a href="mailto:${sender.email}" style="font-size:13px; color:#4f46e5; text-decoration:none;">${sender.email}</a>
                </td>
              </tr>
              ${sender.phone ? `
              <tr>
                <td style="padding-bottom:5px;">
                  <span style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8;">Phone</span><br>
                  <a href="tel:${sender.phone.replace(/\s/g, '')}" style="font-size:13px; color:#0f172a; text-decoration:none;">${sender.phone}</a>
                </td>
              </tr>` : ''}
              <tr>
                <td>
                  <span style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8;">Website</span><br>
                  <a href="${company.website}" style="font-size:13px; color:#4f46e5; text-decoration:none;">${domain}</a>
                </td>
              </tr>
              ${sender.bookingSlug ? `
              <tr>
                <td style="padding-top:10px;">
                  <a href="${process.env.NEXT_PUBLIC_CRM_URL?.replace(/\/$/, '') ?? 'https://crm.vyntrise.com'}/book/${sender.bookingSlug}"
                     style="display:inline-block; padding:7px 16px; background:#4f46e5; color:#ffffff; font-size:12px; font-weight:600; text-decoration:none; border-radius:6px; letter-spacing:-0.1px;">
                    📅 Book a Meeting
                  </a>
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>`
    : '';

  const deptBlock = deptEmail
    ? `
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding-bottom:12px; border-bottom:1px solid #e2e8f0;">
            <span style="font-size:13px; font-weight:700; color:#0f172a;">${company.name}</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top:10px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:5px;">
                  <span style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8;">${deptEmail.label}</span><br>
                  <a href="mailto:${deptEmail.address}" style="font-size:13px; color:#4f46e5; text-decoration:none;">${deptEmail.address}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : '';

  let footerContactRow = '';
  if (senderBlock && deptBlock) {
    footerContactRow = `
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:24px 0; border-top:1px solid #e2e8f0;" valign="top" width="50%">
                ${senderBlock}
              </td>
              <td width="16" style="padding:24px 0;">&nbsp;</td>
              <td style="padding:24px 0; border-top:1px solid #e2e8f0;" valign="top" width="50%">
                ${deptBlock}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  } else if (deptBlock) {
    // No sender, just show the company/dept info in a full-width block
    footerContactRow = `
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:24px 0; border-top:1px solid #e2e8f0;" valign="top" width="100%">
                ${deptBlock}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  const addressLine = company.address
    ? `<br>${company.address.replace(/\n/g, ', ')}`
    : '';

  const footer = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-top:1px solid #e2e8f0; border-radius:0 0 12px 12px;">
      ${footerContactRow}
      <tr>
        <td style="padding:16px 32px 24px; text-align:center;">
          <p style="margin:0 0 6px; font-size:12px; color:#94a3b8;">
            © ${new Date().getFullYear()} ${company.name}${addressLine}
          </p>
          <p style="margin:0; font-size:11px; color:#cbd5e1;">
            This email was sent by ${company.name} via Vyntrize CRM.
            <a href="{{unsubscribeUrl}}" style="color:#94a3b8; text-decoration:underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>`;

  // ── Full shell ───────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    body { margin:0; padding:0; background-color:#f1f5f9; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:12px; box-shadow:0 4px 24px rgba(15,23,42,0.08); overflow:hidden;">

          <!-- HEADER -->
          <tr><td>${header}</td></tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 32px 28px; font-size:15px; line-height:1.7; color:#374151;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- TRACKING PIXEL -->
          ${trackingPixelTag ? `<tr><td>${trackingPixelTag}</td></tr>` : ''}

          <!-- FOOTER -->
          <tr><td>${footer}</td></tr>

        </table>

        <!-- Below-card legal line -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; margin-top:16px;">
          <tr>
            <td style="text-align:center; font-size:11px; color:#94a3b8; padding:0 16px;">
              Sent with Vyntrize CRM &nbsp;·&nbsp;
              <a href="${company.website}" style="color:#94a3b8; text-decoration:none;">${company.name}</a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ─── Main async wrapper ───────────────────────────────────────────────────────

/**
 * Fetches company branding + sender profile from the DB, then wraps the
 * provided HTML body in the full branded email layout.
 *
 * If the HTML already looks like a full document (starts with <!DOCTYPE or <html),
 * the body content is extracted and re-wrapped — so existing seeded templates
 * are automatically upgraded without any template changes.
 */
export async function wrapWithEmailLayout(
  html: string,
  options: LayoutOptions = {}
): Promise<string> {
  // Fetch branding + sender in parallel
  const [company, sender] = await Promise.all([
    options.companyBranding
      ? Promise.resolve(options.companyBranding)
      : loadCompanyBranding(),
    options.userId && !options.senderProfile
      ? loadSenderProfile(options.userId)
      : Promise.resolve(options.senderProfile ?? null),
  ]);

  // If the incoming HTML is already a full document, strip the shell so we
  // don't end up with nested <html> tags.
  const bodyHtml = extractBodyContent(html);

  return buildEmailLayout(bodyHtml, company, sender, options.trackingId);
}

/**
 * Extracts the inner content of a <body> tag, or returns the raw string
 * if no <body> is present (plain fragment / AI-generated text).
 */
function extractBodyContent(html: string): string {
  // Match content between <body...> and </body>
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return bodyMatch[1].trim();

  // No body tag — treat the whole string as the body fragment
  return html.trim();
}
