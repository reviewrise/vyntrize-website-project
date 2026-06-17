import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { convert } from 'html-to-text';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { wrapWithEmailLayout } from './email-layout';

export type EmailRole = 'admin' | 'sales' | 'billing' | 'support';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  bcc?: string;
  trackingId?: string;
  role?: EmailRole;
  
  // CRM Tracking Details 
  leadId?: string;
  contactId?: string;
  campaignId?: string;
  templateId?: number;
  userId?: string;

  /**
   * When true, skip the branded header/footer layout wrapper.
   * Use this for emails that manage their own complete HTML shell
   * (e.g. invoice emails which include company branding inline).
   */
  skipLayout?: boolean;
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
  private transporters: Record<string, Transporter> = {};
  private currentConfigStrings: Record<string, string> = {};

  constructor() {}

  async getConfig(role: EmailRole = 'admin'): Promise<EmailConfig> {
    try {
      const settingKey = `EMAIL_CONFIG_${role.toUpperCase()}`;
      const keysToFetch = [settingKey, 'EMAIL_CONFIG_ADMIN', 'EMAIL_CONFIG'];
      
      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: keysToFetch } }
      });

      let setting = settings.find(s => s.key === settingKey);
      
      // Fallback to admin config if specific role not found
      if (!setting && role !== 'admin') {
        setting = settings.find(s => s.key === 'EMAIL_CONFIG_ADMIN');
      }

      // Legacy fallback
      if (!setting) {
        setting = settings.find(s => s.key === 'EMAIL_CONFIG');
      }

      if (setting && setting.value) {
        return setting.value as unknown as EmailConfig;
      }
    } catch (error) {
      console.error(`[EmailService] Failed to load config for role ${role}:`, error);
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

  private async getTransporter(role: EmailRole = 'admin'): Promise<Transporter | null> {
    const config = await this.getConfig(role);
    if (!config.host || !config.user || !config.pass) {
      return null;
    }

    const configString = JSON.stringify({ host: config.host, port: config.port, secure: config.secure, user: config.user, pass: config.pass });
    
    // Recreate transporter if config changed
    if (this.transporters[role] && this.currentConfigStrings[role] === configString) {
      return this.transporters[role];
    }

    this.currentConfigStrings[role] = configString;
    this.transporters[role] = nodemailer.createTransport({
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
    return this.transporters[role];
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
    const role = options.role || 'admin';
    const transporter = await this.getTransporter(role);
    if (!transporter) {
      return {
        success: false,
        error: `Email service not configured for role: ${role}. Check SMTP configuration.`,
      };
    }

    try {
      if (!this.isValidEmail(options.to)) {
        return {
          success: false,
          error: `Invalid email address: ${options.to}`,
        };
      }

      const config = await this.getConfig(role);
      const fromAddress = options.from || config.fromAddress || 'noreply@vyntrize.com';
      const fromName = options.fromName || config.fromName || 'Vyntrize CRM';
      const replyTo = options.replyTo || config.replyTo;

      // ── Wrap HTML in branded header/footer layout ─────────────────────────
      // Adds company logo header + role-aware sender vCard footer to every email.
      // skipLayout=true is used by emails that manage their own complete HTML shell
      // (e.g. invoice emails which already include company branding inline).
      const wrappedHtml = options.skipLayout
        ? options.html
        : await wrapWithEmailLayout(options.html, {
            userId: options.userId,
            trackingId: options.trackingId,
          });

      const text = options.text || convert(wrappedHtml, {
        wordwrap: 130,
        selectors: [
          { selector: 'a', options: { ignoreHref: false } },
          { selector: 'img', format: 'skip' },
        ],
      });

      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
        bcc: options.bcc,
        replyTo,
        subject: options.subject,
        text,
        html: wrappedHtml,
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

      const trackingId = options.trackingId || crypto.randomUUID();
      try {
        await this.logEmail({
          subject: options.subject,
          body: text,
          htmlBody: wrappedHtml,
          fromEmail: fromAddress,
          fromName: fromName,
          toEmail: options.to,
          toName: options.toName,
          replyTo,
          trackingId,
          status: 'SENT',
          sentAt: new Date(),
          leadId: options.leadId,
          contactId: options.contactId,
          campaignId: options.campaignId,
          templateId: options.templateId,
          userId: options.userId,
        });
      } catch (logError) {
        console.error('[EmailService] Failed to log sent email:', logError);
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('[EmailService] Send error:', error);
      
      const trackingId = options.trackingId || crypto.randomUUID();
      try {
        const config = await this.getConfig(role);
        const fromAddress = options.from || config.fromAddress || 'noreply@vyntrize.com';
        const fromName = options.fromName || config.fromName || 'Vyntrize CRM';
        
        await this.logEmail({
          subject: options.subject,
          body: options.text || '',
          htmlBody: options.html,
          fromEmail: fromAddress,
          fromName: fromName,
          toEmail: options.to,
          toName: options.toName,
          replyTo: options.replyTo || config.replyTo,
          trackingId,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          leadId: options.leadId,
          contactId: options.contactId,
          campaignId: options.campaignId,
          templateId: options.templateId,
          userId: options.userId,
        });
      } catch (logError) {
        console.error('[EmailService] Failed to log failed email:', logError);
      }

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

  /**
   * Centralized method to log emails into the database
   */
  async logEmail(data: {
    subject: string;
    body: string;
    htmlBody?: string;
    fromEmail: string;
    fromName?: string;
    toEmail: string;
    toName?: string;
    replyTo?: string;
    trackingId: string;
    status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
    errorMessage?: string;
    sentAt?: Date;
    leadId?: string;
    contactId?: string;
    campaignId?: string;
    templateId?: number;
    userId?: string;
  }) {
    try {
      // Strip undefined values to satisfy Prisma's Exact type checks
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      const emailLog = await prisma.emailLog.create({
        data: cleanData as any
      });
      return emailLog;
    } catch (error) {
      console.error('[EmailService] Failed to log email to DB:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
