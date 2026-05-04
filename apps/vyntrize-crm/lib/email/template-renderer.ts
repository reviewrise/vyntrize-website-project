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
   * Replace simple variables {{variable}}
   */
  private static replaceVariables(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * Handle conditional blocks {{#if variable}}...{{/if}}
   */
  private static handleConditionals(template: string, variables: TemplateVariables): string {
    return template.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
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
    const trackingDomain = process.env.EMAIL_TRACKING_DOMAIN || 'http://localhost:3014';
    const trackingEnabled = process.env.EMAIL_TRACKING_ENABLED !== 'false';

    if (!trackingEnabled) return '';

    return `<img src="${trackingDomain}/api/email/track/open/${trackingId}" width="1" height="1" alt="" style="display:block;border:0;outline:none;" />`;
  }

  /**
   * Wrap links with tracking URLs
   */
  private static wrapLinksWithTracking(html: string, trackingId: string): string {
    const trackingDomain = process.env.EMAIL_TRACKING_DOMAIN || 'http://localhost:3014';
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
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .email-footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
  </div>
  <div class="email-footer">
    <p>This email was sent from Vyntrize CRM</p>
    <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
  </div>
</body>
</html>
    `.trim();
  }
}
