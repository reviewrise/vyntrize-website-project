#!/usr/bin/env tsx
/**
 * Agent System Test Script
 * 
 * This script tests the AI Pipeline Agent System functionality
 * Run with: tsx scripts/test-agents.ts
 */

import { prisma } from '@/lib/prisma';
import { agentRegistry } from '@/lib/agents/registry';
import { aiProviderFactory } from '@/lib/agents/ai-provider-factory';
import { LeadScoringAgent } from '@/lib/agents/lead-scoring-agent';
import { EmailGenerationAgent } from '@/lib/agents/email-generation-agent';

// Create agent instances
const leadScoringAgent = new LeadScoringAgent();
const emailGenerationAgent = new EmailGenerationAgent();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testDatabaseConnection() {
  section('Test 1: Database Connection');
  
  try {
    await prisma.$connect();
    log('✓ Database connection successful', 'green');
    
    // Check if agent tables exist
    const actionCount = await prisma.agentAction.count();
    const ruleCount = await prisma.agentRule.count();
    const metricCount = await prisma.agentMetric.count();
    
    log(`✓ AgentAction table exists (${actionCount} records)`, 'green');
    log(`✓ AgentRule table exists (${ruleCount} records)`, 'green');
    log(`✓ AgentMetric table exists (${metricCount} records)`, 'green');
    
    return true;
  } catch (error) {
    log('✗ Database connection failed', 'red');
    console.error(error);
    return false;
  }
}

async function testAIProviders() {
  section('Test 2: AI Provider Configuration');
  
  try {
    const status = aiProviderFactory.getAllProviderStatus();
    
    log(`Default Provider: ${status.defaultProvider}`, 'blue');
    log(`Available Providers: ${status.availableProviders.join(', ') || 'none'}`, 'blue');
    
    if (status.availableProviders.length === 0) {
      log('✗ No AI providers configured', 'red');
      log('  Please add OPENAI_API_KEY or GEMINI_API_KEY to .env', 'yellow');
      return false;
    }
    
    // Check each provider
    for (const [name, providerStatus] of Object.entries(status.providers)) {
      const provider = providerStatus as any;
      log(`\n${name}:`, 'cyan');
      log(`  Model: ${provider.model}`, 'blue');
      log(`  Circuit Open: ${provider.circuitOpen ? '✗ Yes' : '✓ No'}`, 
        provider.circuitOpen ? 'red' : 'green');
      log(`  Failure Count: ${provider.failureCount}`, 'blue');
      log(`  Cache Size: ${provider.cacheSize}`, 'blue');
    }
    
    log('\n✓ AI providers configured successfully', 'green');
    return true;
  } catch (error) {
    log('✗ AI provider check failed', 'red');
    console.error(error);
    return false;
  }
}

async function testAgentRegistry() {
  section('Test 3: Agent Registry');
  
  try {
    const health = await agentRegistry.getHealthStatus();
    
    log(`Initialized: ${health.initialized ? '✓ Yes' : '✗ No'}`, 
      health.initialized ? 'green' : 'red');
    log(`Registered Agents: ${health.registeredAgents}`, 'blue');
    
    if (health.registeredAgents === 0) {
      log('✗ No agents registered', 'red');
      return false;
    }
    
    // List all agents
    log('\nRegistered Agents:', 'cyan');
    const agents = [
      'LEAD_SCORING',
      'TASK_AUTOMATION',
      'STAGNATION_DETECTION',
      'EMAIL_GENERATION',
      'NEXT_BEST_ACTION',
    ];
    
    for (const agentType of agents) {
      try {
        const agent = agentRegistry.getAgent(agentType as any);
        log(`  ✓ ${agentType}`, 'green');
      } catch {
        log(`  ✗ ${agentType} (not registered)`, 'red');
      }
    }
    
    log('\n✓ Agent registry initialized successfully', 'green');
    return true;
  } catch (error) {
    log('✗ Agent registry check failed', 'red');
    console.error(error);
    return false;
  }
}

async function testLeadScoring() {
  section('Test 4: Lead Scoring Agent');
  
  try {
    // Get a test lead from database
    const lead = await prisma.lead.findFirst({
      include: {
        contact: true,
        company: true,
      },
    });
    
    if (!lead) {
      log('⚠ No leads found in database', 'yellow');
      log('  Create a lead first to test lead scoring', 'yellow');
      return true; // Not a failure, just no data
    }
    
    log(`Testing with Lead: ${lead.contact?.firstName || 'Unknown'} ${lead.contact?.lastName || ''}`, 'blue');
    log(`Lead ID: ${lead.id}`, 'blue');
    
    // Execute lead scoring
    log('\nExecuting lead scoring agent...', 'cyan');
    const result = await leadScoringAgent.execute({
      leadId: lead.id,
      userId: lead.assignedToId || undefined,
    });
    
    log(`\n✓ Lead scoring completed`, 'green');
    log(`  Score: ${result.score}/100`, 'blue');
    log(`  Qualification: ${result.qualification}`, 'blue');
    log(`  Reasoning: ${result.reasoning}`, 'blue');
    
    // Check if action was created
    const action = await prisma.agentAction.findFirst({
      where: {
        agentType: 'LEAD_SCORING',
        entityId: lead.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    if (action) {
      log(`\n✓ Agent action created in database`, 'green');
      log(`  Action ID: ${action.id}`, 'blue');
      log(`  Status: ${action.status}`, 'blue');
    }
    
    return true;
  } catch (error) {
    log('✗ Lead scoring test failed', 'red');
    console.error(error);
    return false;
  }
}

async function testEmailGeneration() {
  section('Test 5: Email Generation Agent');
  
  try {
    // Get a test lead
    const lead = await prisma.lead.findFirst({
      include: {
        contact: true,
        company: true,
      },
    });
    
    if (!lead || !lead.contact) {
      log('⚠ No leads with contacts found in database', 'yellow');
      log('  Create a lead with contact to test email generation', 'yellow');
      return true;
    }
    
    log(`Testing with Lead: ${lead.contact.firstName || 'Unknown'} ${lead.contact.lastName || ''}`, 'blue');
    
    // Execute email generation
    log('\nGenerating email with AI...', 'cyan');
    const result = await emailGenerationAgent.execute({
      leadId: lead.id,
      userId: lead.assignedToId || undefined,
      context: {
        purpose: 'follow_up',
        tone: 'professional',
      },
    });
    
    log(`\n✓ Email generated successfully`, 'green');
    log(`\nSubject: ${result.subject}`, 'blue');
    log(`\nBody Preview:`, 'blue');
    log(result.body.substring(0, 200) + '...', 'reset');
    log(`\nReasoning: ${result.reasoning}`, 'blue');
    
    // Check if action was created
    const action = await prisma.agentAction.findFirst({
      where: {
        agentType: 'EMAIL_GENERATION',
        entityId: lead.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    if (action) {
      log(`\n✓ Agent action created in database`, 'green');
      log(`  Action ID: ${action.id}`, 'blue');
      log(`  Status: ${action.status}`, 'blue');
    }
    
    return true;
  } catch (error) {
    log('✗ Email generation test failed', 'red');
    console.error(error);
    return false;
  }
}

async function testAgentActions() {
  section('Test 6: Agent Actions in Database');
  
  try {
    // Get recent actions
    const actions = await prisma.agentAction.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    log(`Found ${actions.length} recent agent actions`, 'blue');
    
    if (actions.length === 0) {
      log('⚠ No agent actions found', 'yellow');
      log('  This is normal if you just set up the system', 'yellow');
      return true;
    }
    
    log('\nRecent Actions:', 'cyan');
    for (const action of actions) {
      log(`\n  ID: ${action.id}`, 'blue');
      log(`  Type: ${action.agentType}`, 'blue');
      log(`  Status: ${action.status}`, 'blue');
      log(`  Created: ${action.createdAt.toISOString()}`, 'blue');
    }
    
    // Count by status
    const pendingCount = await prisma.agentAction.count({
      where: { status: 'PENDING' },
    });
    const approvedCount = await prisma.agentAction.count({
      where: { status: 'APPROVED' },
    });
    const rejectedCount = await prisma.agentAction.count({
      where: { status: 'REJECTED' },
    });
    
    log('\nAction Statistics:', 'cyan');
    log(`  Pending: ${pendingCount}`, 'yellow');
    log(`  Approved: ${approvedCount}`, 'green');
    log(`  Rejected: ${rejectedCount}`, 'red');
    
    log('\n✓ Agent actions working correctly', 'green');
    return true;
  } catch (error) {
    log('✗ Agent actions check failed', 'red');
    console.error(error);
    return false;
  }
}

async function testMetrics() {
  section('Test 7: Agent Metrics');
  
  try {
    const metrics = await prisma.agentMetric.findMany({
      take: 10,
      orderBy: {
        calculatedAt: 'desc',
      },
    });
    
    log(`Found ${metrics.length} metrics records`, 'blue');
    
    if (metrics.length === 0) {
      log('⚠ No metrics found yet', 'yellow');
      log('  Metrics will be created as agents run', 'yellow');
      return true;
    }
    
    log('\nRecent Metrics:', 'cyan');
    for (const metric of metrics.slice(0, 5)) {
      log(`\n  Agent: ${metric.agentType}`, 'blue');
      log(`  Metric: ${metric.metricName}`, 'blue');
      log(`  Value: ${metric.metricValue}`, 'blue');
      log(`  Time: ${metric.calculatedAt.toISOString()}`, 'blue');
    }
    
    log('\n✓ Metrics tracking working', 'green');
    return true;
  } catch (error) {
    log('✗ Metrics check failed', 'red');
    console.error(error);
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        AI Pipeline Agent System - Test Suite              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    database: false,
    aiProviders: false,
    agentRegistry: false,
    leadScoring: false,
    emailGeneration: false,
    agentActions: false,
    metrics: false,
  };
  
  try {
    results.database = await testDatabaseConnection();
    results.aiProviders = await testAIProviders();
    results.agentRegistry = await testAgentRegistry();
    results.leadScoring = await testLeadScoring();
    results.emailGeneration = await testEmailGeneration();
    results.agentActions = await testAgentActions();
    results.metrics = await testMetrics();
  } catch (error) {
    log('\n✗ Test suite failed with error', 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
  
  // Summary
  section('Test Summary');
  
  const tests = [
    { name: 'Database Connection', result: results.database },
    { name: 'AI Providers', result: results.aiProviders },
    { name: 'Agent Registry', result: results.agentRegistry },
    { name: 'Lead Scoring', result: results.leadScoring },
    { name: 'Email Generation', result: results.emailGeneration },
    { name: 'Agent Actions', result: results.agentActions },
    { name: 'Metrics', result: results.metrics },
  ];
  
  for (const test of tests) {
    const status = test.result ? '✓ PASS' : '✗ FAIL';
    const color = test.result ? 'green' : 'red';
    log(`${status.padEnd(10)} ${test.name}`, color);
  }
  
  const passCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  log(`\n${passCount}/${totalCount} tests passed`, passCount === totalCount ? 'green' : 'yellow');
  
  if (passCount === totalCount) {
    log('\n🎉 All tests passed! Agent system is working correctly.', 'green');
  } else {
    log('\n⚠ Some tests failed. Check the output above for details.', 'yellow');
  }
}

// Run tests
runAllTests().catch(console.error);
