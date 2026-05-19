// POST /api/agents/trigger - Manually trigger an agent for a specific lead

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { AgentType } from '@platform/vyntrize-db';
import { LeadScoringAgent } from '@/lib/agents/lead-scoring-agent';
import { StagnationDetectionAgent } from '@/lib/agents/stagnation-detection-agent';
import { EmailGenerationAgent } from '@/lib/agents/email-generation-agent';
import { NextBestActionAgent } from '@/lib/agents/next-best-action-agent';
import { StageProgressionAgent } from '@/lib/agents/stage-progression-agent';
import { DripCampaignAgent } from '@/lib/agents/drip-campaign-agent';
import { WorkflowRuleEngine } from '@/lib/agents/workflow-rule-engine';
import { CRMEvent } from '@/lib/agents/event-bus';

interface TriggerBody {
  agentType: AgentType;
  leadId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: TriggerBody = await request.json();

    // Validate input
    if (!body.agentType || !body.leadId) {
      return NextResponse.json(
        { error: 'agentType and leadId are required' },
        { status: 400 }
      );
    }

    // Create agent instance
    let agent;
    switch (body.agentType) {
      case AgentType.LEAD_SCORING:
        agent = new LeadScoringAgent();
        break;
      case AgentType.STAGNATION_DETECTION:
        agent = new StagnationDetectionAgent();
        break;
      case AgentType.EMAIL_GENERATION:
        agent = new EmailGenerationAgent();
        break;
      case AgentType.NEXT_BEST_ACTION:
        agent = new NextBestActionAgent();
        break;
      case AgentType.STAGE_PROGRESSION:
        agent = new StageProgressionAgent();
        break;
      case AgentType.DRIP_CAMPAIGN:
        agent = new DripCampaignAgent();
        break;
      case AgentType.WORKFLOW_RULE: {
        // Workflow Rule Engine needs an event type — use lead_updated for manual trigger
        const engine = new WorkflowRuleEngine();
        const result = await engine.execute({
          leadId: body.leadId,
          userId: session.userId,
          eventData: { event: CRMEvent.LEAD_UPDATED },
        });
        return NextResponse.json({
          success: result.success,
          agentType: body.agentType,
          leadId: body.leadId,
          result: {
            actionId: result.actionId,
            reasoning: result.reasoning,
            metadata: result.metadata,
          },
        });
      }
      default:
        return NextResponse.json(
          { error: `Agent type ${body.agentType} is not supported for manual triggering` },
          { status: 400 }
        );
    }

    // Execute agent
    const result = await agent.execute({
      leadId: body.leadId,
      userId: session.userId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, reasoning: result.reasoning },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      agentType: body.agentType,
      leadId: body.leadId,
      result: {
        actionId: result.actionId,
        reasoning: result.reasoning,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    console.error('[API] Failed to trigger agent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
