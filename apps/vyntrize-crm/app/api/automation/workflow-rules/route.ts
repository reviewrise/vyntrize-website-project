/**
 * Automation API — Workflow Rules
 * GET  /api/automation/workflow-rules  — list rules with last execution status
 * POST /api/automation/workflow-rules  — create rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { workflowRulePayloadSchema } from '@/lib/automation';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rules = await vyntrizeDb.workflowRule.findMany({
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });

    // Fetch last execution AgentAction for each rule (by ruleName in metadata)
    const rulesWithStatus = await Promise.all(
      rules.map(async (rule) => {
        const lastExecution = await vyntrizeDb.agentAction.findFirst({
          where: {
            agentType: 'WORKFLOW_RULE',
            actionType: 'RULE_EXECUTION',
            metadata: {
              path: ['ruleId'],
              equals: rule.id,
            },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            executionError: true,
          },
        });

        return {
          ...rule,
          lastExecution: lastExecution
            ? {
                id: lastExecution.id,
                status: lastExecution.status,
                executedAt: lastExecution.createdAt,
                error: lastExecution.executionError ?? null,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ rules: rulesWithStatus });
  } catch (error) {
    console.error('[Automation API] Error listing workflow rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const parsed = workflowRulePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Require at least one trigger event (triggerEvent is a single string per schema,
    // but we validate it is present and non-empty)
    if (!parsed.data.triggerEvent) {
      return NextResponse.json(
        { error: 'At least one trigger event is required' },
        { status: 400 }
      );
    }

    // Require at least one action (also enforced by schema min(1))
    if (!parsed.data.actions || parsed.data.actions.length === 0) {
      return NextResponse.json(
        { error: 'At least one action is required' },
        { status: 400 }
      );
    }

    const rule = await vyntrizeDb.workflowRule.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        triggerEvent: parsed.data.triggerEvent,
        conditions: parsed.data.conditions,
        actions: parsed.data.actions,
        autonomyLevel: parsed.data.autonomyLevel,
        isActive: parsed.data.isActive ?? true,
        priority: parsed.data.priority ?? 100,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('[Automation API] Error creating workflow rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
