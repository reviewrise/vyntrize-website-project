import { Agent, AgentContext, AgentType, AgentActionResult, AgentConfig, AutonomyLevel } from '../base-agent';
import { CRMEvent } from '../event-bus';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/email-service';
import { TemplateRenderer } from '@/lib/email/template-renderer';

export class TaskExecutionAgent extends Agent {
  constructor() {
    super(AgentType.WORKFLOW_RULE); // Registers under workflow rule category
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!this.enabled) {
      return {
        success: true,
        reasoning: 'TaskExecutionAgent is disabled via feature flag',
      };
    }

    const event = context.eventData?.event as CRMEvent;
    // Only listen for approved tasks
    if (event !== CRMEvent.TASK_APPROVED) {
      return {
        success: true,
        reasoning: `TaskExecutionAgent ignores event: ${event}`,
      };
    }

    const taskId = context.eventData?.taskId;
    if (!taskId) {
      return {
        success: false,
        reasoning: 'No taskId found in context eventData',
        error: 'Missing taskId',
      };
    }

    const task = await prisma.leadTask.findUnique({ where: { id: Number(taskId) } });
    if (!task) {
      return {
        success: false,
        reasoning: `Task with ID ${taskId} not found`,
        error: 'Task not found',
      };
    }

    if (task.status === 'COMPLETED' || task.taskType === 'MANUAL') {
      return {
        success: true,
        reasoning: `Task ${task.id} is already completed or is a MANUAL task. Skipping.`,
      };
    }

    try {
      console.log(`[TaskExecutionAgent] Executing ${task.taskType} task ${task.id}`);
      
      switch (task.taskType) {
        case 'EMAIL':
          await this.executeEmail(task.leadId, task.payload as any);
          break;
        case 'STATUS_UPDATE':
          await this.executeStatusUpdate(task.leadId, task.payload as any);
          break;
        case 'SMS':
          await this.executeSms(task.payload as any);
          break;
        default:
          console.log(`[TaskExecutionAgent] Unsupported task type: ${task.taskType}`);
      }

      await prisma.leadTask.update({
        where: { id: task.id },
        data: { 
          status: 'COMPLETED', 
          completedAt: new Date(),
          executionLog: { success: true, timestamp: new Date() } 
        }
      });

      return {
        success: true,
        reasoning: `Successfully executed ${task.taskType} task ${task.id}`,
      };

    } catch (error: any) {
      console.error(`[TaskExecutionAgent] Failed to execute task ${task.id}:`, error);
      await prisma.leadTask.update({
        where: { id: task.id },
        data: { 
          status: 'FAILED', // Mark as FAILED so it needs explicit attention
          executionLog: { success: false, error: error.message, timestamp: new Date() } 
        }
      });

      return {
        success: false,
        reasoning: `Failed to execute task ${task.id}: ${error.message}`,
        error: error.message,
      };
    }
  }

  private async executeEmail(leadId: string, payload: { to: string; subject: string; body: string }) {
    if (!payload || !payload.to || !payload.subject) {
      throw new Error(`Invalid email payload. Missing "to" or "subject".`);
    }

    console.log(`[TaskExecutionAgent] 📧 Sending Email to ${payload.to}`);
    
    // 1. Fetch Lead & Contact for template vars
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { contact: true }
    });
    
    if (!lead || !lead.contact) {
      throw new Error(`Lead or Contact not found for leadId: ${leadId}`);
    }
    
    const contactName = `${lead.contact.firstName || ''} ${lead.contact.lastName || ''}`.trim();
    
    // 2. Format Body and Render Template
    const trackingId = `task_${leadId}_${Date.now()}`;
    let subject = payload.subject;
    let body = payload.body || '';
    
    const templateVars = {
      firstName: lead.contact.firstName || '',
      lastName: lead.contact.lastName || '',
      email: payload.to,
      leadTitle: lead.title || '',
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/api/email/unsubscribe?email=${encodeURIComponent(payload.to)}`,
    };
    
    // Format body: convert newlines to <p> tags or <br/> and wrap in the beautiful template
    let formattedBody = body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
    if (!formattedBody.startsWith('<p>')) formattedBody = `<p>${formattedBody}</p>`;
    
    formattedBody = TemplateRenderer.wrapInEmailTemplate(formattedBody, subject);
    subject = TemplateRenderer.render(subject, templateVars);
    
    // Apply template variables and add tracking pixel
    formattedBody = TemplateRenderer.renderWithTracking(formattedBody, templateVars, trackingId);
    
    // Inline CSS
    formattedBody = TemplateRenderer.inlineCSS(formattedBody);
    
    // 3. Send Email (which now automatically logs)
    const sendResult = await emailService.sendEmail({
      role: 'sales',
      to: payload.to,
      toName: contactName,
      subject,
      html: formattedBody,
      text: body, // Raw body for reference and logging
      trackingId,
      leadId: lead.id,
      contactId: lead.contact.id,
    });
    
    if (!sendResult.success) {
      console.error(`[TaskExecutionAgent] Email send failed: ${sendResult.error}`);
    }
  }

  private async executeStatusUpdate(leadId: string, payload: { newStatus: string }) {
    if (!payload || !payload.newStatus) {
      throw new Error(`Invalid status update payload. Missing "newStatus".`);
    }

    console.log(`[TaskExecutionAgent] 🔄 Updating Lead ${leadId} stage to ${payload.newStatus}`);
    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: payload.newStatus as any } 
    });
  }

  private async executeSms(payload: { to: string; message: string }) {
    console.log(`[TaskExecutionAgent] 📱 Mocking SMS Send to ${payload.to}`);
  }

  getConfig(): AgentConfig {
    return {
      agentType: AgentType.WORKFLOW_RULE,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
    };
  }
}
