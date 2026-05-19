import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAIProviderFactory } from '@/lib/agents/ai-provider-factory';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = parseInt(params.taskId, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // 1. Fetch the Task and Lead Context
    const task = await prisma.leadTask.findUnique({
      where: { id: taskId },
      include: {
        lead: {
          include: {
            contact: true,
            company: true,
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Allow re-resolution for MANUAL tasks or tasks with null/undefined taskType.
    // Tasks that were already resolved can be re-resolved to generate a fresh draft.
    // Only block if taskType is something that cannot be overwritten (e.g., already APPROVED).
    if (task.taskType && task.taskType !== 'MANUAL' && task.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Completed tasks cannot be re-resolved' },
        { status: 400 }
      );
    }

    // 2. Build the AI Prompt
    const factory = await getAIProviderFactory();
    const provider = factory.getProvider(); // Gets the active default provider

    const systemPrompt = `You are a CRM Task Automation assistant.
Your goal is to take a generic CRM task description and output a structured JSON action payload.

Given the task description and lead context, determine the best action type from these options:
- "EMAIL": Use this if the task implies sending an email (e.g., "follow up", "send pricing").
- "STATUS_UPDATE": Use this if the task implies moving the lead to a new stage.

Output strictly valid JSON with this format:
{
  "taskType": "EMAIL" | "STATUS_UPDATE",
  "payload": {
     // For EMAIL: "subject", "body" (html format), "to" (email address)
     // For STATUS_UPDATE: "newStatus" (e.g. QUALIFIED, PROPOSAL_SENT)
  }
}
Do not include markdown blocks like \`\`\`json.`;

    const userPrompt = `
Task Title: ${task.title}
Task Description: ${task.description || 'No description provided'}

Lead Name: ${task.lead.contact.firstName} ${task.lead.contact.lastName}
Lead Email: ${task.lead.contact.email}
Lead Current Stage: ${task.lead.stage}
`;

    const messages = `${userPrompt}`;

    // 3. Generate Completion using AIRequest interface
    const aiResponse = await provider.generateCompletion({
      prompt: messages,
      systemPrompt,
      temperature: 0.2,
      maxTokens: 1000,
    });

    const responseText = aiResponse.content;

    // 4. Parse JSON
    let result;
    try {
      // Strip markdown code blocks if the LLM ignored instructions
      const cleanJson = responseText.replace(/^```json/i, '').replace(/```$/, '').trim();
      result = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI resolution' }, { status: 500 });
    }

    // 5. Update Task
    const updatedTask = await prisma.leadTask.update({
      where: { id: taskId },
      data: {
        taskType: result.taskType,
        payload: result.payload,
      }
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('[API /crm/tasks/[taskId]/resolve] error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
