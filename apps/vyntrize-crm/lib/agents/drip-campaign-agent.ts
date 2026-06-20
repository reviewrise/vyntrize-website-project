// Drip Campaign Agent — manages drip sequence enrollment, step execution,
// behavior-based branching, and automatic stop conditions.

import {
  Agent,
  AgentType,
  ActionType,
  ActionStatus,
  AutonomyLevel,
  AgentContext,
  AgentActionResult,
  AgentConfig,
} from './base-agent';
import { prisma } from '@/lib/prisma';
import { eventBus, CRMEvent } from './event-bus';
import { StopConditions, TriggerConfig } from '@/lib/automation';
import { jobScheduler, JobPriority } from './job-scheduler';
import { EmailGenerationAgent } from './email-generation-agent';
import { emailService } from '@/lib/email/email-service';
import { TemplateRenderer } from '@/lib/email/template-renderer';
import { sendCustomerSms } from '@/lib/sms/send-customer-sms';
import { buildSmsTemplateVars } from '@/lib/sms/sms-template-vars';
import type {
  Lead,
  Contact,
  DripEnrollment,
  DripSequence,
  DripStep,
  EmailTracking,
} from '@platform/vyntrize-db';

// Full lead shape used during step processing
type LeadWithContact = Lead & {
  contact: Contact;
};

// Enrollment with its sequence and steps
type EnrollmentWithSequence = DripEnrollment & {
  sequence: DripSequence & {
    steps: DripStep[];
  };
};

export class DripCampaignAgent extends Agent {
  constructor() {
    super(AgentType.DRIP_CAMPAIGN);
  }

  // ─── execute ──────────────────────────────────────────────────────────────

  async execute(context: AgentContext): Promise<AgentActionResult> {
    if (!this.enabled) {
      return {
        success: true,
        reasoning: 'DripCampaignAgent is disabled via feature flag',
      };
    }

    // Scheduled / batch call — process all due steps
    if (!context.leadId) {
      return this.processDueSteps();
    }

    // Event-driven call for a specific lead
    try {
      // 1. Check stop conditions on all ACTIVE enrollments for this lead
      const activeEnrollments = await prisma.dripEnrollment.findMany({
        where: { leadId: context.leadId, status: 'ACTIVE' },
        include: {
          sequence: { include: { steps: true } },
        },
      });

      const lead = await prisma.lead.findUnique({
        where: { id: context.leadId },
        include: { contact: true },
      });

      if (lead) {
        for (const enrollment of activeEnrollments) {
          const stopReason = await this.checkStopConditions(
            lead as LeadWithContact,
            enrollment as EnrollmentWithSequence
          );
          if (stopReason) {
            await this.stopEnrollment(enrollment.id, stopReason);
          }
        }

        // If calendar event created, stop all active drip sequences unconditionally
        if (context.eventData?.event === 'calendar_event_created') {
          for (const enrollment of activeEnrollments) {
            if (enrollment.status === 'ACTIVE') {
              await this.stopEnrollment(enrollment.id, 'meeting_scheduled');
            }
          }
          return {
            success: true,
            reasoning: `Stopped ${activeEnrollments.length} active drips because a meeting was scheduled.`,
          };
        }

        // 2. Check if any active DripSequence trigger conditions match this lead
        const sequences = await prisma.dripSequence.findMany({
          where: { isActive: true },
        });

        for (const sequence of sequences) {
          const triggerConfig = sequence.triggerConfig as TriggerConfig;
          let shouldEnroll = false;

          if (sequence.triggerType === 'stage_entered') {
            const newStage = context.eventData?.newValue as string | undefined;
            if (newStage && triggerConfig.stage && newStage === triggerConfig.stage) {
              shouldEnroll = true;
            }
          } else if (sequence.triggerType === 'score_threshold') {
            const score = (lead as Lead).score ?? 0;
            if (
              triggerConfig.scoreThreshold !== undefined &&
              score >= triggerConfig.scoreThreshold
            ) {
              shouldEnroll = true;
            }
          } else if (sequence.triggerType === 'inactivity_days') {
            const lastActivity = (lead as Lead).lastActivityAt;
            if (triggerConfig.inactivityDays !== undefined && lastActivity) {
              const daysSince =
                (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
              if (daysSince >= triggerConfig.inactivityDays) {
                shouldEnroll = true;
              }
            }
          }

          if (shouldEnroll) {
            await this.enroll(
              context.leadId,
              sequence.id,
              `trigger:${sequence.triggerType}`
            );
          }
        }
      }

      return {
        success: true,
        reasoning: `Processed drip campaign events for lead ${context.leadId}`,
      };
    } catch (err) {
      this.log('error', 'Error in DripCampaignAgent.execute', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        reasoning: 'Error processing drip campaign events',
      };
    }
  }

  // ─── enroll ───────────────────────────────────────────────────────────────

  async enroll(
    leadId: string,
    sequenceId: string,
    triggeredBy: string
  ): Promise<void> {
    // 1. Check for existing ACTIVE enrollment — skip silently if found
    const existing = await prisma.dripEnrollment.findFirst({
      where: { leadId, sequenceId, status: 'ACTIVE' },
    });
    if (existing) {
      this.log('info', 'Lead already has active enrollment for this sequence', {
        leadId,
        sequenceId,
      });
      return;
    }

    // 2. Fetch lead with contact — check emailOptOut
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { contact: true },
    });
    if (!lead) {
      this.log('warn', 'Lead not found during enroll', { leadId });
      return;
    }

    const contact = lead.contact as Contact & { emailOptOut?: boolean };
    if (contact.emailOptOut === true) {
      this.log('info', 'Skipping enrollment — contact has emailOptOut=true', {
        leadId,
        sequenceId,
      });
      return;
    }

    // 3. Fetch the DripSequence with its steps
    const sequence = await prisma.dripSequence.findUnique({
      where: { id: sequenceId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!sequence) {
      this.log('warn', 'DripSequence not found during enroll', { sequenceId });
      return;
    }

    // 4. Create DripEnrollment
    const enrollment = await prisma.dripEnrollment.create({
      data: {
        leadId,
        sequenceId,
        status: 'ACTIVE',
        currentStepIndex: 0,
        enrolledAt: new Date(),
      },
    });

    // 5. Record AgentAction
    await this.recordAction(
      ActionType.DRIP_ENROLL,
      leadId,
      `Enrolled in drip sequence: ${triggeredBy}`,
      sequence.autonomyLevel as AutonomyLevel,
      {
        enrollmentId: enrollment.id,
        sequenceId,
        sequenceName: sequence.name,
        triggeredBy,
      }
    );

    // 6. Schedule or pend based on autonomy level
    if (sequence.autonomyLevel === AutonomyLevel.FULLY_AUTONOMOUS) {
      const firstStep = sequence.steps.find((s) => s.stepOrder === 0);
      if (firstStep) {
        if (firstStep.delayHours === 0) {
          // Send immediately — no need to go through the job queue
          await this.processStep(enrollment.id);
        } else {
          await jobScheduler.scheduleJob(
            'DripCampaignAgent',
            { leadId, eventData: { enrollmentId: enrollment.id } },
            JobPriority.MEDIUM,
            firstStep.delayHours * 3600 * 1000
          );
        }
      }
    }
    // If SUGGEST_APPROVE: action is already PENDING from recordAction
  }

  // ─── processStep ──────────────────────────────────────────────────────────

  async processStep(enrollmentId: string): Promise<void> {
    // 1. Fetch enrollment with sequence and steps
    const enrollment = await prisma.dripEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        sequence: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
      },
    });

    if (!enrollment) {
      this.log('warn', 'Enrollment not found', { enrollmentId });
      return;
    }

    // Abort if not ACTIVE
    if (enrollment.status !== 'ACTIVE') {
      this.log('info', 'Enrollment is not ACTIVE, skipping step', {
        enrollmentId,
        status: enrollment.status,
      });
      return;
    }

    const typedEnrollment = enrollment as EnrollmentWithSequence;

    // 2. Fetch lead with contact
    const lead = await prisma.lead.findUnique({
      where: { id: enrollment.leadId },
      include: { contact: true },
    });

    if (!lead) {
      this.log('warn', 'Lead not found during processStep', {
        leadId: enrollment.leadId,
      });
      return;
    }

    // 3. Check stop conditions
    const stopReason = await this.checkStopConditions(
      lead as LeadWithContact,
      typedEnrollment
    );
    if (stopReason) {
      await this.stopEnrollment(enrollmentId, stopReason);
      return;
    }

    // 4. Get current step by currentStepIndex
    const currentStep = typedEnrollment.sequence.steps.find(
      (s) => s.stepOrder === enrollment.currentStepIndex
    );

    if (!currentStep) {
      // No more steps — mark COMPLETED
      await prisma.dripEnrollment.update({
        where: { id: enrollmentId },
        data: { status: 'COMPLETED' },
      });
      this.log('info', 'Enrollment completed — no more steps', { enrollmentId });
      return;
    }

    // 5. Evaluate branch condition
    const branchPasses = await this.checkBranchCondition(
      lead.id,
      currentStep.branchCondition,
      currentStep.emailBodyTemplate ? 'email' : 'sms'
    );
    if (!branchPasses) {
      this.log('info', 'Branch condition not met, skipping step', {
        enrollmentId,
        branchCondition: currentStep.branchCondition,
      });
      return;
    }

    // 6 + 7. Send step — execute SMS and/or Email in parallel
    const contact = (lead as LeadWithContact).contact;
    const recordedActions: ActionType[] = [];

    // ── SMS step ────────────────────────────────────────────────────────
    if (currentStep.smsBodyTemplate && !contact.smsOptOut) {
      const smsTemplateVars = buildSmsTemplateVars(contact, lead as any);
      try {
        await sendCustomerSms({
          to:        contact.phone,
          message:   currentStep.smsBodyTemplate,
          variables: smsTemplateVars,
          leadId:    lead.id,
          contactId: contact.id,
        });
        recordedActions.push(ActionType.SMS_SEND);
      } catch (smsErr) {
        this.log('error', 'SMS drip step error (continuing enrollment)', smsErr);
      }
    }

    // ── Email step ───────────────────────────────────────────────────────
    if (currentStep.emailBodyTemplate) {
      // Try EmailGenerationAgent for personalization; fall back to raw templates
      let subject = currentStep.emailSubjectTemplate || 'Follow up';
      let body = currentStep.emailBodyTemplate;

      try {
        const emailAgent = new EmailGenerationAgent();
        const result = await emailAgent.execute({ leadId: lead.id });
        if (result.success && result.metadata?.emailDraft) {
          const draft = result.metadata.emailDraft as { subject: string; body: string };
          subject = draft.subject;
          body = draft.body;
        }
      } catch (err) {
        this.log('warn', 'EmailGenerationAgent failed, using raw templates', err);
      }

      // Render templates and send email via EmailService
      const contactEmail = contact.email;
      const trackingId = `drip_${enrollmentId}_step${currentStep.stepOrder}_${Date.now()}`;

      const templateVars = {
        firstName: contact.firstName || '',
        lastName:  contact.lastName  || '',
        email:     contactEmail,
        leadTitle: lead.title || '',
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/api/email/unsubscribe?email=${encodeURIComponent(contactEmail)}`,
      };

      let formattedBody = body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
      if (!formattedBody.startsWith('<p>')) formattedBody = `<p>${formattedBody}</p>`;
      // We rely on emailService.sendEmail to apply the global email layout.
      subject = TemplateRenderer.render(subject, templateVars);
      formattedBody = TemplateRenderer.renderWithTracking(formattedBody, templateVars, trackingId);
      formattedBody = TemplateRenderer.inlineCSS(formattedBody);

      try {
        await emailService.sendEmail({
          role:      'sales',
          to:        contactEmail,
          toName:    `${contact.firstName} ${contact.lastName}`.trim(),
          subject,
          html:      formattedBody,
          text:      body,
          trackingId,
          leadId:    lead.id,
          contactId: contact.id,
          userId:    lead.assigneeId ?? undefined,
        } as Parameters<typeof emailService.sendEmail>[0]);
        recordedActions.push(ActionType.EMAIL_SEND);
      } catch (err) {
        this.log('error', 'Email drip step error', err);
      }
    }

    // 8. Update enrollment
    const nextStepIndex = enrollment.currentStepIndex + 1;
    await prisma.dripEnrollment.update({
      where: { id: enrollmentId },
      data: {
        currentStepIndex: nextStepIndex,
        lastStepSentAt: new Date(),
      },
    });

    // 9. Record AgentActions
    for (const actionType of recordedActions) {
      await this.recordAction(
        actionType,
        lead.id,
        `Drip step ${enrollment.currentStepIndex} sent (${actionType}) for sequence ${typedEnrollment.sequence.name}`,
        AutonomyLevel.FULLY_AUTONOMOUS,
        {
          enrollmentId,
          sequenceId: enrollment.sequenceId,
          stepOrder:  currentStep.stepOrder,
        }
      );
    }

    // 10. Check if next step exists; schedule it or mark COMPLETED
    const nextStep = typedEnrollment.sequence.steps.find(
      (s) => s.stepOrder === nextStepIndex
    );

    if (nextStep) {
      // Determine delay — 'clicked' branch condition uses 0-hour delay override
      const delayMs =
        currentStep.branchCondition === 'clicked'
          ? 0
          : nextStep.delayHours * 3600 * 1000;

      if (delayMs === 0) {
        // Send immediately — no need to go through the job queue
        await this.processStep(enrollmentId);
      } else {
        await jobScheduler.scheduleJob(
          'DripCampaignAgent',
          { leadId: lead.id, eventData: { enrollmentId } },
          JobPriority.MEDIUM,
          delayMs
        );
      }
    } else {
      // Last step — mark enrollment COMPLETED
      await prisma.dripEnrollment.update({
        where: { id: enrollmentId },
        data: { status: 'COMPLETED' },
      });
      this.log('info', 'Enrollment completed after last step', { enrollmentId });
    }
  }

  // ─── checkBranchCondition (private) ──────────────────────────────────────

  private async checkBranchCondition(
    leadId: string,
    branchCondition: string,
    stepType: string = 'email'
  ): Promise<boolean> {
    // SMS steps have no open tracking — opened/not_opened always proceed
    if (stepType === 'sms' && (branchCondition === 'opened' || branchCondition === 'not_opened')) {
      return true;
    }

    if (branchCondition === 'always') {
      return true;
    }

    if (branchCondition === 'clicked') {
      // 0-hour delay override — always proceed
      return true;
    }

    // Check both EmailTracking (manual sends) and EmailLog (drip sends) for the lead
    const [emailTracking, emailLog] = await Promise.all([
      prisma.emailTracking.findFirst({
        where: { leadId },
        orderBy: { sentAt: 'desc' },
      }),
      prisma.emailLog.findFirst({
        where: { leadId, trackingId: { startsWith: 'drip_' } },
        orderBy: { sentAt: 'desc' },
      }),
    ]);

    // Use whichever is more recent
    const mostRecent = [emailTracking, emailLog]
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = (a as any)?.sentAt?.getTime() ?? 0;
        const bTime = (b as any)?.sentAt?.getTime() ?? 0;
        return bTime - aTime;
      })[0];

    if (branchCondition === 'opened') {
      return (mostRecent as any)?.openedAt != null;
    }

    if (branchCondition === 'not_opened') {
      return (mostRecent as any)?.openedAt == null;
    }

    // Unknown condition — default to true
    return true;
  }

  // ─── stopEnrollment ───────────────────────────────────────────────────────

  async stopEnrollment(enrollmentId: string, reason: string): Promise<void> {
    const enrollment = await prisma.dripEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      this.log('warn', 'Enrollment not found during stopEnrollment', {
        enrollmentId,
      });
      return;
    }

    // 1. Update DripEnrollment status
    await prisma.dripEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'STOPPED',
        stoppedReason: reason,
      },
    });

    // 2. Record AgentAction
    await prisma.agentAction.create({
      data: {
        agentType: this.agentType,
        actionType: ActionType.DRIP_ENROLL,
        leadId: enrollment.leadId,
        reasoning: `Drip enrollment stopped: ${reason}`,
        autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
        status: ActionStatus.EXECUTED,
        executedAt: new Date(),
        metadata: { action: 'stopped', reason, enrollmentId },
      },
    });

    this.log('info', 'Enrollment stopped', { enrollmentId, reason });
  }

  // ─── checkStopConditions ──────────────────────────────────────────────────

  async checkStopConditions(
    lead: LeadWithContact,
    enrollment: EnrollmentWithSequence
  ): Promise<string | null> {
    const stopConditions = enrollment.sequence.stopConditions as StopConditions;

    if (!stopConditions) {
      return null;
    }

    // onStageReached
    if (
      stopConditions.onStageReached &&
      lead.stage === stopConditions.onStageReached
    ) {
      return 'stage_reached';
    }

    // onScoreExceeds
    if (
      stopConditions.onScoreExceeds !== undefined &&
      (lead.score ?? 0) > stopConditions.onScoreExceeds
    ) {
      return 'score_exceeded';
    }

    // onEmailReply
    if (stopConditions.onEmailReply === true) {
      const trackingReplied = await prisma.emailTracking.findFirst({
        where: { leadId: lead.id, repliedAt: { not: null } },
      });
      const activityReplied = await prisma.activity.findFirst({
        where: { 
          leadId: lead.id, 
          type: 'EMAIL', 
          body: { contains: '**Customer Replied:**' } 
        },
      });
      if (trackingReplied || activityReplied) {
        return 'email_replied';
      }
    }

    // Stop if they have an active scheduled meeting
    const upcomingMeeting = await prisma.calendarEvent.findFirst({
      where: {
        leadId: lead.id,
        status: 'SCHEDULED',
        startTime: { gte: new Date() },
      }
    });

    if (upcomingMeeting) {
      return 'meeting_scheduled';
    }

    return null;
  }

  // ─── processDueSteps ──────────────────────────────────────────────────────

  private async processDueSteps(): Promise<AgentActionResult> {
    const activeEnrollments = await prisma.dripEnrollment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        sequence: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
      },
    });

    let processed = 0;
    let errors = 0;

    for (const enrollment of activeEnrollments) {
      const typedEnrollment = enrollment as EnrollmentWithSequence;
      const currentStep = typedEnrollment.sequence.steps.find(
        (s) => s.stepOrder === enrollment.currentStepIndex
      );

      if (!currentStep) {
        continue;
      }

      // Check if due
      const isDue =
        enrollment.lastStepSentAt === null ||
        Date.now() >=
          enrollment.lastStepSentAt.getTime() +
            currentStep.delayHours * 3600 * 1000;

      if (isDue) {
        try {
          await this.processStep(enrollment.id);
          processed++;
        } catch (err) {
          errors++;
          this.log('error', 'Error processing drip step', {
            enrollmentId: enrollment.id,
            err,
          });
        }
      }
    }

    return {
      success: true,
      reasoning: `Processed due drip steps. Processed: ${processed}, Errors: ${errors}`,
      metadata: {
        total: activeEnrollments.length,
        processed,
        errors,
      },
    };
  }

  // ─── applyApprovedEnrollment ──────────────────────────────────────────────

  async applyApprovedEnrollment(actionId: string): Promise<void> {
    const action = await prisma.agentAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      this.log('error', 'AgentAction not found for applyApprovedEnrollment', {
        actionId,
      });
      return;
    }

    const metadata = action.metadata as Record<string, unknown>;
    const enrollmentId = metadata.enrollmentId as string;
    const sequenceId = metadata.sequenceId as string;

    const enrollment = await prisma.dripEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        sequence: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
      },
    });

    if (!enrollment) {
      this.log('warn', 'Enrollment not found for applyApprovedEnrollment', {
        enrollmentId,
      });
      return;
    }

    const typedEnrollment = enrollment as EnrollmentWithSequence;
    const firstStep = typedEnrollment.sequence.steps.find(
      (s) => s.stepOrder === 0
    );

    if (firstStep) {
      await jobScheduler.scheduleJob(
        'DripCampaignAgent',
        { leadId: enrollment.leadId, eventData: { enrollmentId } },
        JobPriority.MEDIUM,
        firstStep.delayHours * 3600 * 1000
      );
    }

    // Mark action EXECUTED
    await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: ActionStatus.EXECUTED,
        executedAt: new Date(),
      },
    });

    this.log('info', 'Approved drip enrollment applied', {
      enrollmentId,
      sequenceId,
      actionId,
    });
  }

  // ─── getConfig ────────────────────────────────────────────────────────────

  getConfig(): AgentConfig {
    return {
      agentType: AgentType.DRIP_CAMPAIGN,
      enabled: this.enabled,
      autonomyLevel: AutonomyLevel.FULLY_AUTONOMOUS,
      executionFrequency: '*/5 * * * *',
    };
  }
}

// Singleton instance for use in API routes
export const dripCampaignAgent = new DripCampaignAgent();
