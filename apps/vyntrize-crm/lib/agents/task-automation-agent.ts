// Task Automation Agent - Automatically creates tasks when leads change stages

import { Agent, AgentType, ActionType, AutonomyLevel, AgentContext, AgentActionResult, AgentConfig } from './base-agent';
import { prisma } from '@/lib/prisma';
import { LeadStage, TaskPriority } from '@platform/vyntrize-db';

interface StageTaskConfig {
  stage: LeadStage;
  taskTitle: string;
  taskDescription: string;
  dueInDays: number;
  priority: TaskPriority;
}

export class TaskAutomationAgent extends Agent {
  private stageConfigs: StageTaskConfig[] = [
    {
      stage: 'CONTACTED',
      taskTitle: 'Follow up with lead',
      taskDescription: 'Schedule a follow-up call or email to continue the conversation',
      dueInDays: 2,
      priority: 'MEDIUM',
    },
    {
      stage: 'QUALIFIED',
      taskTitle: 'Prepare proposal',
      taskDescription: 'Create and send a detailed proposal based on lead requirements',
      dueInDays: 3,
      priority: 'HIGH',
    },
    {
      stage: 'PROPOSAL_SENT',
      taskTitle: 'Follow up on proposal',
      taskDescription: 'Check if the lead has reviewed the proposal and answer any questions',
      dueInDays: 5,
      priority: 'HIGH',
    },
  ];

  constructor() {
    super(AgentType.TASK_AUTOMATION);
  }

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!context.leadId) {
      return {
        success: false,
        error: 'Lead ID required',
        reasoning: 'Cannot create task without lead ID',
      };
    }

    try {
      // Fetch lead data
      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        include: {
          contact: true,
          assignee: true,
          leadTasks: {
            where: {
              status: {
                in: ['PENDING', 'IN_PROGRESS'],
              },
            },
          },
        },
      });

      if (!lead) {
        return {
          success: false,
          error: 'Lead not found',
          reasoning: 'Lead does not exist',
        };
      }

      // Get stage from event data or current lead stage
      const newStage = (context.eventData?.newValue as LeadStage) || lead.stage;

      // Find task configuration for this stage
      const config = this.stageConfigs.find(c => c.stage === newStage);

      if (!config) {
        // No task automation for this stage
        return {
          success: true,
          reasoning: `No task automation configured for stage: ${newStage}`,
        };
      }

      // Check if similar task already exists (prevent duplicates)
      const existingTask = lead.leadTasks.find(
        task => task.title === config.taskTitle
      );

      if (existingTask) {
        return {
          success: true,
          reasoning: `Task "${config.taskTitle}" already exists for this lead`,
        };
      }

      // Calculate due date (business days)
      const dueDate = this.calculateDueDate(config.dueInDays);

      // Determine assignee (use lead assignee, or current user, or leave unassigned)
      const assignedToId = lead.assigneeId || context.userId || null;

      // Create task
      const task = await prisma.leadTask.create({
        data: {
          leadId: lead.id,
          title: config.taskTitle,
          description: config.taskDescription,
          priority: config.priority,
          dueDate,
          assignedToId,
          createdById: context.userId || lead.assigneeId || 'system',
          status: 'PENDING',
        },
      });

      // Record action
      const reasoning = this.generateReasoning(lead, config, assignedToId);
      const actionId = await this.recordAction(
        ActionType.TASK_CREATE,
        context.leadId,
        reasoning,
        AutonomyLevel.FULLY_AUTONOMOUS,
        {
          taskId: task.id,
          taskTitle: config.taskTitle,
          stage: newStage,
          dueDate: dueDate.toISOString(),
          assignedToId,
        }
      );

      this.log('info', 'Task created automatically', {
        leadId: context.leadId,
        taskId: task.id,
        stage: newStage,
      });

      return {
        success: true,
        actionId,
        reasoning,
        metadata: {
          taskId: task.id,
          taskTitle: config.taskTitle,
          dueDate: dueDate.toISOString(),
        },
      };
    } catch (error) {
      this.log('error', 'Failed to create task', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Error during task creation',
      };
    }
  }

  /**
   * Calculate due date in business days
   */
  private calculateDueDate(daysFromNow: number): Date {
    const date = new Date();
    let addedDays = 0;

    while (addedDays < daysFromNow) {
      date.setDate(date.getDate() + 1);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    // Set to end of business day (5 PM)
    date.setHours(17, 0, 0, 0);

    return date;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    lead: any,
    config: StageTaskConfig,
    assignedToId: string | null
  ): string {
    const assigneeName = lead.assignee?.displayName || 'unassigned';
    const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`;

    return `Automatically created task "${config.taskTitle}" for ${contactName} (stage: ${config.stage}). Task assigned to ${assigneeName}, due in ${config.dueInDays} business days.`;
  }

  getConfig(): AgentConfig {
    return {
      agentType: this.agentType,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
      priority: 'HIGH',
    };
  }
}
