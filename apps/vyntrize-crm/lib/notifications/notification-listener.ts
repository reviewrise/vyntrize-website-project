/**
 * Notification Listener
 *
 * Subscribes to the AgentEventBus and creates in-app notifications for
 * relevant CRM events. All handlers are async and wrapped in try/catch —
 * a notification failure must never interrupt the primary CRM operation
 * that emitted the event.
 *
 * Registration happens once at app startup via registerNotificationListener()
 * called from lib/notifications/index.ts inside instrumentation.ts.
 */

import { eventBus, CRMEvent, EventPayload } from '@/lib/agents/event-bus';
import { notificationService } from './notification-service';
import { getTriggerConfig } from './trigger-config';
import { NotificationEventType } from '@platform/vyntrize-db';

// ─── Handler: LEAD_CREATED ────────────────────────────────────────────────────
//
// Target: assigned user (if set) + all ADMINs.
// Deduplication: if the assignee is also an admin they receive exactly one
// notification — we pass the assignee's userId as an excluded ID when notifying
// admins so createNotificationsForAdmins skips them.

async function handleLeadCreated(payload: EventPayload) {
  try {
    const trigger = await getTriggerConfig('LEAD_CREATED');
    if (!trigger) return; // globally disabled

    const leadTitle  = (payload.metadata?.leadTitle as string | undefined) ?? 'New lead';
    const assigneeId = payload.metadata?.assigneeId as string | undefined;
    const leadId     = payload.leadId;

    const notifyInput = {
      eventType:  NotificationEventType.LEAD_CREATED,
      title:      `New lead: ${leadTitle}`,
      entityType: 'lead',
      entityId:   leadId,
    };

    const shouldNotifyAssignee = assigneeId && (trigger.recipients === 'assignee' || trigger.recipients === 'both');
    const shouldNotifyAdmins   = trigger.recipients === 'admins' || trigger.recipients === 'both';

    if (shouldNotifyAssignee) {
      await notificationService.createNotification({ ...notifyInput, userId: assigneeId! });
    }
    if (shouldNotifyAdmins) {
      await notificationService.createNotificationsForAdmins(
        notifyInput,
        shouldNotifyAssignee && assigneeId ? [assigneeId] : [],
      );
    }
  } catch (err) {
    console.error('[NotificationListener] handleLeadCreated error:', err);
  }
}

// ─── Handler: STAGE_CHANGED ───────────────────────────────────────────────────

async function handleStageChanged(payload: EventPayload) {
  try {
    const trigger = await getTriggerConfig('STAGE_CHANGED');
    if (!trigger) return;

    const assigneeId = payload.metadata?.assigneeId as string | undefined;
    if (!assigneeId) {
      console.warn('[NotificationListener] STAGE_CHANGED event has no assigned user — skipping notification');
      return;
    }

    const prevStage = payload.previousValue as string | undefined;
    const newStage  = payload.newValue as string | undefined;
    const leadId    = payload.leadId;

    await notificationService.createNotification({
      userId:     assigneeId,
      eventType:  NotificationEventType.STAGE_CHANGED,
      title:      `Lead moved: ${prevStage ?? '?'} → ${newStage ?? '?'}`,
      entityType: 'lead',
      entityId:   leadId,
    });
  } catch (err) {
    console.error('[NotificationListener] handleStageChanged error:', err);
  }
}

// ─── Handler: TASK_CREATED ────────────────────────────────────────────────────

async function handleTaskCreated(payload: EventPayload) {
  try {
    const trigger = await getTriggerConfig('TASK_CREATED');
    if (!trigger) return;

    const assignedToId = payload.metadata?.assignedToId as string | undefined;
    if (!assignedToId) {
      console.warn('[NotificationListener] TASK_CREATED event has no assignedToId — skipping notification');
      return;
    }

    const taskTitle = (payload.metadata?.taskTitle as string | undefined) ?? 'New task';
    const taskId    = payload.taskId?.toString();

    await notificationService.createNotification({
      userId:     assignedToId,
      eventType:  NotificationEventType.TASK_CREATED,
      title:      `New task assigned: ${taskTitle}`,
      entityType: 'task',
      entityId:   taskId,
    });
  } catch (err) {
    console.error('[NotificationListener] handleTaskCreated error:', err);
  }
}

// ─── Handler: TASK_COMPLETED ──────────────────────────────────────────────────

async function handleTaskCompleted(payload: EventPayload) {
  try {
    const trigger = await getTriggerConfig('TASK_COMPLETED');
    if (!trigger) return;

    const createdById = payload.metadata?.createdById as string | undefined;
    if (!createdById) {
      console.warn('[NotificationListener] TASK_COMPLETED event has no createdById — skipping notification');
      return;
    }

    const taskTitle = (payload.metadata?.taskTitle as string | undefined) ?? 'Task';
    const taskId    = payload.taskId?.toString();

    await notificationService.createNotification({
      userId:     createdById,
      eventType:  NotificationEventType.TASK_COMPLETED,
      title:      `Task completed: ${taskTitle}`,
      entityType: 'task',
      entityId:   taskId,
    });
  } catch (err) {
    console.error('[NotificationListener] handleTaskCompleted error:', err);
  }
}

// ─── Handler: CALENDAR_EVENT_CREATED / CALENDAR_EVENT_UPDATED ────────────────

async function handleCalendarEvent(payload: EventPayload, event: CRMEvent) {
  try {
    const eventTypeKey = event === CRMEvent.CALENDAR_EVENT_CREATED
      ? 'CALENDAR_EVENT_CREATED'
      : 'CALENDAR_EVENT_UPDATED';

    const trigger = await getTriggerConfig(eventTypeKey);
    if (!trigger) return;

    const userId = payload.userId;
    if (!userId) {
      console.warn(`[NotificationListener] ${event} has no userId — skipping notification`);
      return;
    }

    const eventTitle  = (payload.metadata?.eventTitle as string | undefined) ?? 'Calendar event';
    const calendarId  = (payload.metadata?.calendarEventId as string | undefined);
    const isCreated   = event === CRMEvent.CALENDAR_EVENT_CREATED;

    await notificationService.createNotification({
      userId,
      eventType:  isCreated ? NotificationEventType.CALENDAR_EVENT_CREATED : NotificationEventType.CALENDAR_EVENT_UPDATED,
      title:      isCreated ? `New calendar event: ${eventTitle}` : `Calendar event updated: ${eventTitle}`,
      entityType: 'calendar_event',
      entityId:   calendarId,
    });
  } catch (err) {
    console.error(`[NotificationListener] handleCalendarEvent (${event}) error:`, err);
  }
}

// ─── Handler: MEETING_ATTENDED ────────────────────────────────────────────────

async function handleMeetingAttended(payload: EventPayload) {
  try {
    const trigger = await getTriggerConfig('MEETING_ATTENDED');
    if (!trigger) return;

    const userId = payload.userId;
    if (!userId) {
      console.warn('[NotificationListener] MEETING_ATTENDED event has no userId — skipping notification');
      return;
    }

    const eventTitle = (payload.metadata?.eventTitle as string | undefined) ?? 'Meeting';
    const calendarId = (payload.metadata?.calendarEventId as string | undefined);

    await notificationService.createNotification({
      userId,
      eventType:  NotificationEventType.MEETING_ATTENDED,
      title:      `Meeting attended: ${eventTitle}`,
      entityType: 'calendar_event',
      entityId:   calendarId,
    });
  } catch (err) {
    console.error('[NotificationListener] handleMeetingAttended error:', err);
  }
}

// ─── Handler: MEETING_MISSED ──────────────────────────────────────────────────

async function handleMeetingMissed(payload: EventPayload) {
  try {
    const trigger = await getTriggerConfig('MEETING_MISSED');
    if (!trigger) return;

    const userId = payload.userId;
    if (!userId) {
      console.warn('[NotificationListener] MEETING_MISSED event has no userId — skipping notification');
      return;
    }

    const eventTitle = (payload.metadata?.eventTitle as string | undefined) ?? 'Meeting';
    const calendarId = (payload.metadata?.calendarEventId as string | undefined);

    await notificationService.createNotification({
      userId,
      eventType:  NotificationEventType.MEETING_MISSED,
      title:      `Meeting missed: ${eventTitle}`,
      entityType: 'calendar_event',
      entityId:   calendarId,
    });
  } catch (err) {
    console.error('[NotificationListener] handleMeetingMissed error:', err);
  }
}

// ─── Handler: AGENT_ACTION_PENDING ──────────────────────────────────────────────

async function handleAgentActionPending(payload: EventPayload) {
  try {
    const trigger = await getTriggerConfig('AGENT_ACTION_PENDING');
    if (!trigger) return;

    const leadId = payload.leadId;
    const actionType = (payload.metadata?.actionType as string | undefined) ?? 'Action pending';
    const reasoning = (payload.metadata?.reasoning as string | undefined) ?? 'Requires review';
    const actionId = payload.metadata?.actionId as string | undefined;

    const notifyInput = {
      eventType: NotificationEventType.AGENT_ACTION_PENDING,
      title: `Agent Action Pending: ${actionType} - ${reasoning}`,
      entityType: 'lead',
      entityId: leadId,
    };

    // If there's an assignee, we can notify them. Usually we notify admins too.
    const assigneeId = payload.metadata?.assigneeId as string | undefined;
    const shouldNotifyAssignee = assigneeId && (trigger.recipients === 'assignee' || trigger.recipients === 'both');
    const shouldNotifyAdmins   = trigger.recipients === 'admins' || trigger.recipients === 'both';

    if (shouldNotifyAssignee) {
      await notificationService.createNotification({ ...notifyInput, userId: assigneeId! });
    }
    if (shouldNotifyAdmins) {
      await notificationService.createNotificationsForAdmins(
        notifyInput,
        shouldNotifyAssignee && assigneeId ? [assigneeId] : [],
      );
    }
  } catch (err) {
    console.error('[NotificationListener] handleAgentActionPending error:', err);
  }
}

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerNotificationListener(): void {
  eventBus.on(CRMEvent.LEAD_CREATED,           (p: EventPayload) => handleLeadCreated(p));
  eventBus.on(CRMEvent.STAGE_CHANGED,          (p: EventPayload) => handleStageChanged(p));
  eventBus.on(CRMEvent.TASK_CREATED,           (p: EventPayload) => handleTaskCreated(p));
  eventBus.on(CRMEvent.TASK_COMPLETED,         (p: EventPayload) => handleTaskCompleted(p));
  eventBus.on(CRMEvent.CALENDAR_EVENT_CREATED, (p: EventPayload) => handleCalendarEvent(p, CRMEvent.CALENDAR_EVENT_CREATED));
  eventBus.on(CRMEvent.CALENDAR_EVENT_UPDATED, (p: EventPayload) => handleCalendarEvent(p, CRMEvent.CALENDAR_EVENT_UPDATED));
  eventBus.on(CRMEvent.MEETING_ATTENDED,       (p: EventPayload) => handleMeetingAttended(p));
  eventBus.on(CRMEvent.MEETING_MISSED,         (p: EventPayload) => handleMeetingMissed(p));
  // Provide any event matching AGENT_ACTION_PENDING
  eventBus.on('agent_action_pending' as CRMEvent, (p: EventPayload) => handleAgentActionPending(p));

  console.log('[NotificationListener] Registered for all CRM events');
}
