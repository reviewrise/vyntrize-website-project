/**
 * POST /api/automation/test-welcome-email
 * Directly tests the full welcome email chain for a given lead.
 * Bypasses the event bus and workflow rule engine entirely.
 * Use this to diagnose why the welcome email isn't sending.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { DripCampaignAgent } from '@/lib/agents/drip-campaign-agent';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { leadId } = await request.json();
  if (!leadId) {
    return NextResponse.json({ error: 'leadId required' }, { status: 400 });
  }

  const log: string[] = [];

  try {
    // 1. Check lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { contact: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found', log }, { status: 404 });
    }
    log.push(`✓ Lead found: ${lead.title} (stage: ${lead.stage})`);
    log.push(`  Contact: ${(lead.contact as any)?.firstName} ${(lead.contact as any)?.lastName} <${(lead.contact as any)?.email}>`);
    log.push(`  emailOptOut: ${(lead.contact as any)?.emailOptOut}`);

    // 2. Find the welcome sequence
    const sequence = await prisma.dripSequence.findFirst({
      where: { name: 'New Lead Welcome Sequence', isActive: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!sequence) {
      log.push('✗ "New Lead Welcome Sequence" not found or inactive');
      return NextResponse.json({ success: false, log }, { status: 200 });
    }
    log.push(`✓ Sequence found: "${sequence.name}" (${sequence.steps.length} steps, autonomy: ${sequence.autonomyLevel})`);
    log.push(`  Steps: ${sequence.steps.map(s => `step${s.stepOrder}(${s.delayHours}h, ${s.branchCondition})`).join(', ')}`);

    // 3. Check for existing active enrollment
    const existing = await prisma.dripEnrollment.findFirst({
      where: { leadId, sequenceId: sequence.id, status: 'ACTIVE' },
    });

    if (existing) {
      log.push(`⚠ Lead already has ACTIVE enrollment (id: ${existing.id}) — will skip duplicate`);
      log.push('  Deleting existing enrollment to allow re-enrollment for this test...');
      await prisma.dripEnrollment.update({
        where: { id: existing.id },
        data: { status: 'STOPPED', stoppedReason: 'test-reset' },
      });
      log.push('  ✓ Existing enrollment stopped');
    } else {
      log.push('✓ No existing active enrollment — proceeding');
    }

    // 4. Enroll directly
    log.push('→ Calling DripCampaignAgent.enroll()...');
    const agent = new DripCampaignAgent();
    await agent.enroll(leadId, sequence.id, 'test-welcome-email-api');
    log.push('✓ enroll() completed');

    // 5. Check what happened
    const enrollment = await prisma.dripEnrollment.findFirst({
      where: { leadId, sequenceId: sequence.id },
      orderBy: { enrolledAt: 'desc' },
    });

    if (!enrollment) {
      log.push('✗ No enrollment record created — enroll() silently skipped');
    } else {
      log.push(`✓ Enrollment created: status=${enrollment.status}, step=${enrollment.currentStepIndex}`);
      if (enrollment.lastStepSentAt) {
        log.push(`✓ Email sent at: ${enrollment.lastStepSentAt}`);
      } else {
        log.push('⚠ lastStepSentAt is null — email may not have been sent yet');
      }
    }

    // 6. Check email logs
    const emailLog = await prisma.emailLog.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    if (emailLog) {
      log.push(`✓ Email log found: to=${emailLog.toEmail}, subject="${emailLog.subject}", status=${emailLog.status}`);
    } else {
      log.push('⚠ No email log found for this lead');
    }

    return NextResponse.json({ success: true, log });
  } catch (err) {
    log.push(`✗ Error: ${err instanceof Error ? err.message : String(err)}`);
    if (err instanceof Error && err.stack) {
      log.push(`  Stack: ${err.stack.split('\n').slice(0, 5).join(' | ')}`);
    }
    return NextResponse.json({ success: false, log }, { status: 500 });
  }
}
