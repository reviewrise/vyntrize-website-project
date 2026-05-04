/**
 * Email Service - Core email sending functionality using Nodemailer
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { convert } from 'html-to-text';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  trackingId?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the email transporter with SMTP configuration
   */
  private initialize() {
    try {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT || '587');
      const secure = process.env.SMTP_SECURE === 'true';
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASSWORD;

      if (!host || !user || !pass) {
        console.warn('[EmailService] SMTP configuration incomplete. Email sending disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100,
      });

      this.initialized = true;
      console.log('[EmailService] Initialized successfully');
    } catch (error) {
      console.error('[EmailService] Initialization error:', error);
      this.initialized = false;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('[EmailService] SMTP connection verified');
      return true;
    } catch (error) {
      console.error('[EmailService] SMTP verification failed:', error);
      return false;
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.initialized || !this.transporter) {
      return {
        success: false,
        error: 'Email service not initialized. Check SMTP configuration.',
      };
    }

    try {
      // Validate email address
      if (!this.isValidEmail(options.to)) {
        return {
          success: false,
          error: `Invalid email address: ${options.to}`,
        };
      }

      // Generate plain text version if not provided
      const text = options.text || convert(options.html, {
        wordwrap: 130,
        selectors: [
          { selector: 'a', options: { ignoreHref: false } },
          { selector: 'img', format: 'skip' },
        ],
      });

      // Prepare email
      const fromAddress = options.from || process.env.EMAIL_FROM_ADDRESS || 'noreply@vyntrize.com';
      const fromName = options.fromName || process.env.EMAIL_FROM_NAME || 'Vyntrize CRM';
      const replyTo = options.replyTo || process.env.EMAIL_REPLY_TO;

      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
        replyTo,
        subject: options.subject,
        text,
        html: options.html,
        headers: options.trackingId ? {
          'X-Tracking-ID': options.trackingId,
        } : undefined,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      console.log('[EmailService] Email sent:', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('[EmailService] Send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<BulkEmailResult> {
    const result: BulkEmailResult = {
      total: emails.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    const rateLimit = parseInt(process.env.EMAIL_QUEUE_RATE_LIMIT || '100');
    const batchSize = parseInt(process.env.EMAIL_QUEUE_BATCH_SIZE || '50');

    // Process in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      // Send batch with rate limiting
      const batchPromises = batch.map(async (email) => {
        const sendResult = await this.sendEmail(email);
        
        if (sendResult.success) {
          result.sent++;
        } else {
          result.failed++;
          result.errors.push({
            email: email.to,
            error: sendResult.error || 'Unknown error',
          });
        }
      });

      await Promise.all(batchPromises);

      // Rate limiting delay between batches
      if (i + batchSize < emails.length) {
        const delayMs = (60 * 1000) / rateLimit * batchSize;
        await this.delay(delayMs);
      }
    }

    console.log('[EmailService] Bulk send complete:', result);
    return result;
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      configured: !!process.env.SMTP_HOST && !!process.env.SMTP_USER,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
