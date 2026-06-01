import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { convert } from 'html-to-text';
import { prisma } from '@/lib/prisma';

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

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromAddress?: string;
  fromName?: string;
  replyTo?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private currentConfigString: string = '';

  constructor() {}

  async getConfig(): Promise<EmailConfig> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'EMAIL_CONFIG' }
      });
      if (setting && setting.value) {
        return setting.value as unknown as EmailConfig;
      }
    } catch (error) {
      console.error('[EmailService] Failed to load config from DB:', error);
    }
    // Fallback to .env
    return {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@vyntrize.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Vyntrize CRM',
      replyTo: process.env.EMAIL_REPLY_TO
    };
  }

  private async getTransporter(): Promise<Transporter | null> {
    const config = await this.getConfig();
    if (!config.host || !config.user || !config.pass) {
      return null;
    }

    const configString = JSON.stringify({ host: config.host, port: config.port, secure: config.secure, user: config.user, pass: config.pass });
    
    // Recreate transporter if config changed
    if (this.transporter && this.currentConfigString === configString) {
      return this.transporter;
    }

    this.currentConfigString = configString;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
    return this.transporter;
  }

  async verifyConnection(): Promise<boolean> {
    const transporter = await this.getTransporter();
    if (!transporter) return false;
    try {
      await transporter.verify();
      console.log('[EmailService] SMTP connection verified');
      return true;
    } catch (error) {
      console.error('[EmailService] SMTP verification failed:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const transporter = await this.getTransporter();
    if (!transporter) {
      return {
        success: false,
        error: 'Email service not configured. Check SMTP configuration.',
      };
    }

    try {
      if (!this.isValidEmail(options.to)) {
        return {
          success: false,
          error: `Invalid email address: ${options.to}`,
        };
      }

      const text = options.text || convert(options.html, {
        wordwrap: 130,
        selectors: [
          { selector: 'a', options: { ignoreHref: false } },
          { selector: 'img', format: 'skip' },
        ],
      });

      const config = await this.getConfig();
      const fromAddress = options.from || config.fromAddress || 'noreply@vyntrize.com';
      const fromName = options.fromName || config.fromName || 'Vyntrize CRM';
      const replyTo = options.replyTo || config.replyTo;

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

      const info = await transporter.sendMail(mailOptions);

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

  async sendBulkEmails(emails: EmailOptions[]): Promise<BulkEmailResult> {
    const result: BulkEmailResult = {
      total: emails.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    const rateLimit = parseInt(process.env.EMAIL_QUEUE_RATE_LIMIT || '100');
    const batchSize = parseInt(process.env.EMAIL_QUEUE_BATCH_SIZE || '50');

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
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

      if (i + batchSize < emails.length) {
        const delayMs = (60 * 1000) / rateLimit * batchSize;
        await this.delay(delayMs);
      }
    }

    console.log('[EmailService] Bulk send complete:', result);
    return result;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getStatus() {
    const config = await this.getConfig();
    return {
      configured: !!config.host && !!config.user,
    };
  }
}

export const emailService = new EmailService();
