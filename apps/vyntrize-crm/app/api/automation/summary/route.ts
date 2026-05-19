/**
 * Automation API — Summary
 * GET /api/automation/summary
 *
 * Returns:
 *   - activeDripEnrollmentCount   — ACTIVE DripEnrollment records
 *   - pendingApprovalCount        — PENDING STAGE_CHANGE AgentAction records
 *   - workflowRulesFiredLast24h   — RULE_EXECUTION AgentAction records in last 24h
 *   - emailsSentByAutomationLast24h — EMAIL_SEND AgentAction records in last 24h
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      activeDripEnrollmentCount,
      pendingApprovalCount,
      workflowRulesFiredLast24h,
      emailsSentByAutomationLast24h,
    ] = await Promise.all([
      // Active drip enrollments
      vyntrizeDb.dripEnrollment.count({
        where: { status: 'ACTIVE' },
      }),

      // Pending stage progression approvals
      vyntrizeDb.agentAction.count({
        where: {
          agentType: 'STAGE_PROGRESSION',
          actionType: 'STAGE_CHANGE',
          status: 'PENDING',
        },
      }),

      // Workflow rules fired in last 24h
      vyntrizeDb.agentAction.count({
        where: {
          agentType: 'WORKFLOW_RULE',
          actionType: 'RULE_EXECUTION',
          createdAt: { gte: since24h },
        },
      }),

      // Emails sent by automation (drip campaign) in last 24h
      vyntrizeDb.agentAction.count({
        where: {
          agentType: 'DRIP_CAMPAIGN',
          actionType: 'EMAIL_SEND',
          status: 'EXECUTED',
          createdAt: { gte: since24h },
        },
      }),
    ]);

    return NextResponse.json({
      activeDripEnrollmentCount,
      pendingApprovalCount,
      workflowRulesFiredLast24h,
      emailsSentByAutomationLast24h,
    });
  } catch (error) {
    console.error('[Automation API] Error fetching summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
