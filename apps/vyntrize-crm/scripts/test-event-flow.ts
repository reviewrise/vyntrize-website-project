// Test script to verify the entire event flow for Task Automation Agent

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from CRM app directory
config({ path: resolve(__dirname, '../.env') });

import { eventBus, CRMEvent } from '../lib/agents/event-bus';
import { agentRegistry } from '../lib/agents/registry';

async function testEventFlow() {
  console.log('=== Task Automation Agent Event Flow Test ===\n');

  // Step 1: Check if agent registry is initialized
  console.log('Step 1: Check Agent Registry');
  console.log('  Initialized:', agentRegistry.isInitialized());
  
  if (!agentRegistry.isInitialized()) {
    console.log('  Initializing agent registry...');
    await agentRegistry.registerAllAgents();
    console.log('  Initialized:', agentRegistry.isInitialized());
  }
  console.log('');

  // Step 2: Check registered agents for STAGE_CHANGED event
  console.log('Step 2: Check Registered Agents for STAGE_CHANGED');
  const stageChangedAgents = eventBus.getAgents(CRMEvent.STAGE_CHANGED);
  console.log('  Count:', stageChangedAgents.length);
  stageChangedAgents.forEach((agent, index) => {
    console.log(`  ${index + 1}. ${agent.constructor.name}`);
  });
  console.log('');

  // Step 3: Simulate a STAGE_CHANGED event
  console.log('Step 3: Simulate STAGE_CHANGED Event');
  const testPayload = {
    leadId: 'test-lead-id',
    userId: 'test-user-id',
    previousValue: 'CONTACTED',
    newValue: 'QUALIFIED',
    metadata: {
      closingNote: null,
    },
  };
  
  console.log('  Emitting event with payload:', testPayload);
  
  try {
    await eventBus.emitCRMEvent(CRMEvent.STAGE_CHANGED, testPayload);
    console.log('  ✅ Event emitted successfully');
  } catch (error) {
    console.log('  ❌ Event emission failed:', error);
  }
  console.log('');

  // Step 4: Check if event was received by agents
  console.log('Step 4: Check Event Reception');
  console.log('  Check server logs above for:');
  console.log('    - [EventBus] Emitting stage_changed');
  console.log('    - [Agent] Task created automatically');
  console.log('');

  console.log('=== Test Complete ===');
  console.log('\nIf you see agent execution logs above, the event system is working.');
  console.log('If not, there is an issue with event bus or agent registration.');
}

testEventFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
