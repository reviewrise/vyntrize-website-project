/**
 * Template Renderer - Handle variable substitution and HTML processing
 */

import juice from 'juice';

export interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

export class TemplateRenderer {
  /**
   * Render template with variable substitution
   * Supports: {{variable}}, {{#if variable}}...{{/if}}, {{#each items}}...{{/each}}
   */
  static render(template: string, variables: TemplateVariables): string {
    let rendered = template;

    // Replace simple variables {{variable}}
    rendered = this.replaceVariables(rendered, variables);

    // Handle conditional blocks {{#if variable}}...{{/if}}
    rendered = this.handleConditionals(rendered, variables);

    // Handle loops {{#each items}}...{{/each}}
    rendered = this.handleLoops(rendered, variables);

    return rendered;
  }

  /**
   * Render template with tracking (adds tracking pixel and wraps links)
   */
  static renderWithTracking(
    template: string,
    variables: TemplateVariables,
    trackingId: string
  ): string {
    let rendered = this.render(template, variables);

    // Add tracking pixel at the end
    const trackingPixel = this.generateTrackingPixel(trackingId);
    rendered = rendered.replace('</body>', `${trackingPixel}</body>`);

    // Wrap links with tracking
    rendered = this.wrapLinksWithTracking(rendered, trackingId);

    return rendered;
  }

  /**
   * Inline CSS for better email client compatibility
   */
  static inlineCSS(html: string): string {
    try {
      return juice(html);
    } catch (error) {
      console.error('[TemplateRenderer] CSS inlining error:', error);
      return html;
    }
  }

  /**
   * Replace simple variables {{variable}} and {{dot.notation}}
   */
  private static replaceVariables(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
      const value = variables[key];
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * Handle conditional blocks {{#if variable}} and {{#if dot.notation}}...{{/if}}
   */
  private static handleConditionals(template: string, variables: TemplateVariables): string {
    return template.replace(
      /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, key, content) => {
        const value = variables[key];
        return value ? content : '';
      }
    );
  }

  /**
   * Handle loops {{#each items}}...{{/each}}
   * Note: This is a simplified implementation. For complex loops, consider using a proper template engine.
   */
  private static handleLoops(template: string, variables: TemplateVariables): string {
    return template.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, key, content) => {
        const items = variables[key];
        if (!Array.isArray(items)) return '';

        return items
          .map((item, index) => {
            let itemContent = content;
            // Replace {{this}} with the item value
            itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
            // Replace {{@index}} with the index
            itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
            // If item is an object, replace {{property}}
            if (typeof item === 'object' && item !== null) {
              Object.keys(item).forEach((prop) => {
                const regex = new RegExp(`\\{\\{${prop}\\}\\}`, 'g');
                itemContent = itemContent.replace(regex, String(item[prop]));
              });
            }
            return itemContent;
          })
          .join('');
      }
    );
  }

  /**
   * Generate tracking pixel HTML
   */
  private static generateTrackingPixel(trackingId: string): string {
    // EMAIL_TRACKING_DOMAIN is a runtime server-side env var (not baked at build time).
    // NEXT_PUBLIC_CRM_URL is a fallback (baked at build time — can be wrong in production).
    let trackingDomain =
      process.env.EMAIL_TRACKING_DOMAIN ||
      process.env.NEXT_PUBLIC_CRM_URL ||
      'https://crm.vyntrise.com';
    if (!trackingDomain.startsWith('http://') && !trackingDomain.startsWith('https://')) {
      trackingDomain = `https://${trackingDomain}`;
    }
    trackingDomain = trackingDomain.replace(/\/$/, '');
    const trackingEnabled = process.env.EMAIL_TRACKING_ENABLED !== 'false';

    if (!trackingEnabled) return '';

    return `<img src="${trackingDomain}/api/email/track/open/${trackingId}" width="1" height="1" alt="" style="display:block;border:0;outline:none;" />`;
  }

  /**
   * Wrap links with tracking URLs
   */
  private static wrapLinksWithTracking(html: string, trackingId: string): string {
    let trackingDomain =
      process.env.EMAIL_TRACKING_DOMAIN ||
      process.env.NEXT_PUBLIC_CRM_URL ||
      'https://crm.vyntrise.com';
    if (!trackingDomain.startsWith('http://') && !trackingDomain.startsWith('https://')) {
      trackingDomain = `https://${trackingDomain}`;
    }
    trackingDomain = trackingDomain.replace(/\/$/, '');
    const trackingEnabled = process.env.EMAIL_TRACKING_ENABLED !== 'false';

    if (!trackingEnabled) return html;

    return html.replace(
      /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
      (match, attributes, url) => {
        // Skip if already a tracking URL or anchor link
        if (url.startsWith('#') || url.includes('/api/email/track/')) {
          return match;
        }

        // Create tracking URL
        const trackingUrl = `${trackingDomain}/api/email/track/click/${trackingId}?url=${encodeURIComponent(url)}`;
        
        // Replace the href
        const newAttributes = attributes.replace(
          /href=["']([^"']+)["']/i,
          `href="${trackingUrl}"`
        );

        return `<a ${newAttributes}>`;
      }
    );
  }

  /**
   * Extract variables from template
   */
  static extractVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // Extract {{variable}}
    const simpleMatches = template.matchAll(/\{\{(\w+)\}\}/g);
    for (const match of simpleMatches) {
      variables.add(match[1]);
    }

    // Extract {{#if variable}}
    const ifMatches = template.matchAll(/\{\{#if\s+(\w+)\}\}/g);
    for (const match of ifMatches) {
      variables.add(match[1]);
    }

    // Extract {{#each items}}
    const eachMatches = template.matchAll(/\{\{#each\s+(\w+)\}\}/g);
    for (const match of eachMatches) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Validate that all required variables are provided
   */
  static validateVariables(template: string, variables: TemplateVariables): {
    valid: boolean;
    missing: string[];
  } {
    const required = this.extractVariables(template);
    const missing = required.filter(key => !(key in variables));

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Create a basic HTML email wrapper
   */
  static wrapInEmailTemplate(content: string, title?: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Email from Vyntrize CRM'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f9fafb;
      margin: 0;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
    }
    .email-header {
      text-align: center;
      padding-bottom: 24px;
    }
    .email-header h1 {
      margin: 0;
      color: #111827;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #f3f4f6;
    }
    .email-body {
      font-size: 16px;
      color: #374151;
    }
    .email-body p {
      margin-top: 0;
      margin-bottom: 20px;
    }
    .email-body p:last-child {
      margin-bottom: 0;
    }
    .email-footer {
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }
    .email-footer p {
      margin-top: 0;
      margin-bottom: 8px;
    }
    a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover {
      text-decoration: underline;
    }
    .logo-placeholder {
      display: inline-block;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="logo-placeholder"></div>
      <h1>Vyntrize CRM</h1>
    </div>
    <div class="email-container">
      <div class="email-body">
        ${content}
      </div>
      <div class="email-footer">
        <p>This email was sent securely by Vyntrize CRM on behalf of your team.</p>
        <p><a href="{{unsubscribeUrl}}">Unsubscribe from these emails</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
