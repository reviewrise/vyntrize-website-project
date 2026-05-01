// Lead Activity Service - Link analytics events to leads

import { vyntrizeDb } from '@platform/vyntrize-db';

export interface CreateLeadActivityInput {
  leadId: string;
  activityType: string;
  activityName?: string;
  activityData?: Record<string, any>;
  pageUrl?: string;
  sessionId?: string;
  ipAddressHash?: string;
  userAgent?: string;
}

export class LeadActivityService {
  /**
   * Create a lead activity record
   */
  static async createActivity(input: CreateLeadActivityInput): Promise<void> {
    try {
      await vyntrizeDb.leadActivity.create({
        data: {
          leadId: input.leadId,
          activityType: input.activityType,
          activityName: input.activityName,
          activityData: input.activityData,
          pageUrl: input.pageUrl,
          sessionId: input.sessionId,
          ipAddressHash: input.ipAddressHash,
          userAgent: input.userAgent,
        },
      });

      // Update lead's last activity timestamp
      await vyntrizeDb.lead.update({
        where: { id: input.leadId },
        data: { lastActivityAt: new Date() },
      });
    } catch (error) {
      console.error('Error creating lead activity:', error);
      throw error;
    }
  }

  /**
   * Associate visitor ID with lead when form is submitted
   */
  static async associateVisitorWithLead(
    visitorId: string,
    sessionId: string,
    leadId: string
  ): Promise<void> {
    try {
      // Update lead with visitor and session IDs
      await vyntrizeDb.lead.update({
        where: { id: leadId },
        data: {
          visitorId,
          sessionId,
        },
      });

      // Get all analytics events for this visitor
      const events = await vyntrizeDb.analyticsEvent.findMany({
        where: { visitorId },
        orderBy: { createdAt: 'asc' },
      });

      // Create lead activities from analytics events
      const activities = events.map((event) => ({
        leadId,
        activityType: event.eventType,
        activityName: event.eventName,
        activityData: event.eventData as any,
        pageUrl: event.pageUrl,
        sessionId: event.sessionId,
        ipAddressHash: event.ipAddressHash,
        userAgent: event.userAgent,
      }));

      // Bulk create activities (skip duplicates)
      if (activities.length > 0) {
        await vyntrizeDb.leadActivity.createMany({
          data: activities,
          skipDuplicates: true,
        });
      }

      // Update last activity timestamp
      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        await vyntrizeDb.lead.update({
          where: { id: leadId },
          data: { lastActivityAt: lastEvent.createdAt },
        });
      }
    } catch (error) {
      console.error('Error associating visitor with lead:', error);
      throw error;
    }
  }

  /**
   * Get lead activities with pagination
   */
  static async getLeadActivities(
    leadId: string,
    options: {
      page?: number;
      pageSize?: number;
      activityType?: string;
    } = {}
  ) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where = {
      leadId,
      ...(options.activityType && { activityType: options.activityType }),
    };

    const [activities, total] = await Promise.all([
      vyntrizeDb.leadActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      vyntrizeDb.leadActivity.count({ where }),
    ]);

    return {
      activities,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get activity summary for a lead
   */
  static async getActivitySummary(leadId: string) {
    const activities = await vyntrizeDb.leadActivity.findMany({
      where: { leadId },
      select: { activityType: true },
    });

    const summary = activities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: activities.length,
      byType: summary,
    };
  }

  /**
   * Track ongoing visitor activity for existing leads
   */
  static async trackVisitorActivity(visitorId: string): Promise<void> {
    try {
      // Find lead with this visitor ID
      const lead = await vyntrizeDb.lead.findFirst({
        where: { visitorId },
      });

      if (!lead) return;

      // Get recent events (last 5 minutes) that haven't been tracked yet
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentEvents = await vyntrizeDb.analyticsEvent.findMany({
        where: {
          visitorId,
          createdAt: { gte: fiveMinutesAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (recentEvents.length === 0) return;

      // Check which events are already tracked
      const existingActivities = await vyntrizeDb.leadActivity.findMany({
        where: {
          leadId: lead.id,
          sessionId: { in: recentEvents.map((e) => e.sessionId) },
        },
        select: { sessionId: true, activityType: true, createdAt: true },
      });

      // Create a set of existing activity keys
      const existingKeys = new Set(
        existingActivities.map(
          (a) => `${a.sessionId}-${a.activityType}-${a.createdAt.getTime()}`
        )
      );

      // Filter out events that are already tracked
      const newEvents = recentEvents.filter((event) => {
        const key = `${event.sessionId}-${event.eventType}-${event.createdAt.getTime()}`;
        return !existingKeys.has(key);
      });

      if (newEvents.length === 0) return;

      // Create activities for new events
      const activities = newEvents.map((event) => ({
        leadId: lead.id,
        activityType: event.eventType,
        activityName: event.eventName,
        activityData: event.eventData as any,
        pageUrl: event.pageUrl,
        sessionId: event.sessionId,
        ipAddressHash: event.ipAddressHash,
        userAgent: event.userAgent,
      }));

      await vyntrizeDb.leadActivity.createMany({
        data: activities,
        skipDuplicates: true,
      });

      // Update last activity timestamp
      await vyntrizeDb.lead.update({
        where: { id: lead.id },
        data: { lastActivityAt: new Date() },
      });
    } catch (error) {
      console.error('Error tracking visitor activity:', error);
      // Don't throw - this is a background operation
    }
  }
}
