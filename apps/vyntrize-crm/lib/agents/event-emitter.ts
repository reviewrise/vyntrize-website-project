// Event Emitter Helper - Utility functions to emit CRM events from application code

import { eventBus, CRMEvent, EventPayload } from './event-bus';

/**
 * Emit a lead created event
 */
export async function emitLeadCreated(leadId: string, userId?: string, metadata?: Record<string, unknown>) {
  await eventBus.emitCRMEvent(CRMEvent.LEAD_CREATED, {
    leadId,
    userId,
    metadata,
  });
}

/**
 * Emit a lead updated event
 */
export async function emitLeadUpdated(
  leadId: string,
  userId?: string,
  previousValue?: unknown,
  newValue?: unknown,
  metadata?: Record<string, unknown>
) {
  await eventBus.emitCRMEvent(CRMEvent.LEAD_UPDATED, {
    leadId,
    userId,
    previousValue,
    newValue,
    metadata,
  });
}

/**
 * Emit a stage changed event
 */
export async function emitStageChanged(
  leadId: string,
  previousStage: string,
  newStage: string,
  userId?: string
) {
  await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, {
    leadId,
    userId,
    previousValue: previousStage,
    newValue: newStage,
    metadata: {
      previousStage,
      newStage,
    },
  });
}

/**
 * Emit an email opened event
 */
export async function emitEmailOpened(leadId: string, emailId: string, metadata?: Record<string, unknown>) {
  await eventBus.emitCRMEvent(CRMEvent.EMAIL_OPENED, {
    leadId,
    metadata: {
      emailId,
      ...metadata,
    },
  });
}

/**
 * Emit an email clicked event
 */
export async function emitEmailClicked(leadId: string, emailId: string, metadata?: Record<string, unknown>) {
  await eventBus.emitCRMEvent(CRMEvent.EMAIL_CLICKED, {
    leadId,
    metadata: {
      emailId,
      ...metadata,
    },
  });
}

/**
 * Emit a task completed event
 */
export async function emitTaskCompleted(leadId: string, taskId: number, userId?: string) {
  await eventBus.emitCRMEvent(CRMEvent.TASK_COMPLETED, {
    leadId,
    userId,
    metadata: {
      taskId,
    },
  });
}

/**
 * Emit a contact created event
 */
export async function emitContactCreated(contactId: string, userId?: string, metadata?: Record<string, unknown>) {
  await eventBus.emitCRMEvent(CRMEvent.CONTACT_CREATED, {
    contactId,
    userId,
    metadata,
  });
}

/**
 * Generic event emitter for custom events
 */
export async function emitCRMEvent(event: CRMEvent, payload: EventPayload) {
  await eventBus.emitCRMEvent(event, payload);
}
