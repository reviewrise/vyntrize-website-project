// Email Template Service - Manages email templates for automation

import { prisma } from '@/lib/prisma';
import { EmailTemplateType } from '@platform/vyntrize-db';

interface TemplateVariable {
  [key: string]: string;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: EmailTemplateType;
  variables: TemplateVariable | null;
}

export class EmailTemplateService {
  /**
   * Get template by type (returns first matching template)
   */
  async getTemplateByType(type: EmailTemplateType): Promise<EmailTemplate | null> {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        type,
        isShared: true, // Only use shared templates for automation
      },
      orderBy: {
        createdAt: 'desc', // Get most recent template
      },
    });

    return template as EmailTemplate | null;
  }

  /**
   * Get all templates by type
   */
  async getTemplatesByType(type: EmailTemplateType): Promise<EmailTemplate[]> {
    const templates = await prisma.emailTemplate.findMany({
      where: {
        type,
        isShared: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return templates as EmailTemplate[];
  }

  /**
   * Replace template variables with actual values
   */
  replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      // Replace {{key}} with value
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }

    // Remove any remaining unreplaced variables
    result = result.replace(/{{[^}]+}}/g, '');

    return result;
  }

  /**
   * Get template for stage change
   */
  async getStageChangeTemplate(
    previousStage: string,
    newStage: string
  ): Promise<EmailTemplate | null> {
    // Map stage transitions to template types
    const stageTemplateMap: Record<string, EmailTemplateType> = {
      'NEW->CONTACTED': EmailTemplateType.WELCOME,
      'CONTACTED->QUALIFIED': EmailTemplateType.STAGE_CHANGE,
      'QUALIFIED->PROPOSAL_SENT': EmailTemplateType.PROPOSAL,
      'PROPOSAL_SENT->WON': EmailTemplateType.FOLLOW_UP,
    };

    const transition = `${previousStage}->${newStage}`;
    const templateType = stageTemplateMap[transition];

    if (!templateType) {
      return null;
    }

    return this.getTemplateByType(templateType);
  }

  /**
   * Get template for engagement response
   */
  async getEngagementTemplate(engagementType: string): Promise<EmailTemplate | null> {
    // For now, use ENGAGEMENT_RESPONSE for all engagement types
    // In the future, could have different templates for opens vs clicks
    return this.getTemplateByType(EmailTemplateType.ENGAGEMENT_RESPONSE);
  }

  /**
   * Get template for re-engagement
   */
  async getReEngagementTemplate(): Promise<EmailTemplate | null> {
    return this.getTemplateByType(EmailTemplateType.RE_ENGAGEMENT);
  }

  /**
   * Extract variables from lead data
   */
  extractLeadVariables(lead: any): Record<string, string> {
    const variables: Record<string, string> = {
      firstName: lead.contact?.firstName || '',
      lastName: lead.contact?.lastName || '',
      fullName: lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : '',
      email: lead.contact?.email || '',
      phone: lead.contact?.phone || '',
      jobTitle: lead.contact?.jobTitle || '',
      companyName: lead.company?.name || '',
      leadTitle: lead.title || '',
      stage: lead.stage || '',
      score: lead.score?.toString() || '',
      dealValue: lead.dealValue?.toString() || '',
      // Add more as needed
    };

    return variables;
  }

  /**
   * Merge AI-generated content with template
   * Uses template structure but replaces main content with AI-generated text
   */
  mergeAIContentWithTemplate(
    template: EmailTemplate,
    aiSubject: string,
    aiBody: string,
    variables: Record<string, string>
  ): { subject: string; body: string } {
    // Replace variables in template
    let subject = this.replaceVariables(template.subject, variables);
    let body = this.replaceVariables(template.body, variables);

    // If AI generated better subject, use it
    if (aiSubject && aiSubject.length > 0) {
      subject = aiSubject;
    }

    // Replace the main content area in template with AI-generated body
    // Look for the main content section (between first <p> after header and before footer)
    const contentRegex = /(<td style="padding: 40px 30px;">)([\s\S]*?)(<\/td>[\s\S]*?<tr>[\s\S]*?<td style="background-color: #f8f9fa;|$)/;
    const match = body.match(contentRegex);

    if (match) {
      // Convert AI plain text to HTML paragraphs
      const aiBodyHtml = aiBody
        .split('\n\n')
        .map(para => `<p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">${para.trim()}</p>`)
        .join('\n              ');

      // Replace content section with AI-generated content
      body = body.replace(
        contentRegex,
        `$1\n              ${aiBodyHtml}\n            $3`
      );
    } else {
      // Fallback: if template structure not found, use AI body as-is
      body = aiBody;
    }

    return { subject, body };
  }

  /**
   * Get template suggestion for trigger type
   */
  getTemplateSuggestion(triggerType: string, triggerData?: any): EmailTemplateType | null {
    switch (triggerType) {
      case 'stage_change':
        if (triggerData?.newStage === 'CONTACTED') return EmailTemplateType.WELCOME;
        if (triggerData?.newStage === 'QUALIFIED') return EmailTemplateType.STAGE_CHANGE;
        if (triggerData?.newStage === 'PROPOSAL_SENT') return EmailTemplateType.PROPOSAL;
        return EmailTemplateType.STAGE_CHANGE;

      case 'engagement':
        return EmailTemplateType.ENGAGEMENT_RESPONSE;

      case 'inactivity':
        return EmailTemplateType.RE_ENGAGEMENT;

      case 'manual':
      default:
        return EmailTemplateType.GENERAL;
    }
  }
}

// Singleton instance
let _templateServiceInstance: EmailTemplateService | null = null;

export function getEmailTemplateService(): EmailTemplateService {
  if (!_templateServiceInstance) {
    _templateServiceInstance = new EmailTemplateService();
  }
  return _templateServiceInstance;
}
