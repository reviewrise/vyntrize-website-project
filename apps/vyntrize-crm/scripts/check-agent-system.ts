// Quick diagnostic script to check agent system status

import { agentRegistry } from '../lib/agents/registry';
import { eventBus, CRMEvent } from '../lib/agents/event-bus';

async function checkAgentSystem() {
  console.log('=== Agent System Diagnostic ===\n');

  // Check environment variables
  console.log('1. Environment Variables:');
  console.log('   REDIS_HOST:', process.env.REDIS_HOST || 'NOT SET');
  console.log('   REDIS_PORT:', process.env.REDIS_PORT || 'NOT SET');
  console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
  console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
  console.log('   AGENT_TASK_AUTOMATION_ENABLED:', process.env.AGENT_TASK_AUTOMATION_ENABLED || 'NOT SET');
  console.log('');

  // Check registry initialization
  console.log('2. Agent Registry:');
  console.log('   Initialized:', agentRegistry.isInitialized());
  console.log('');

  // Check registered agents for STAGE_CHANGED event
  console.log('3. Agents Registered for STAGE_CHANGED Event:');
  const stageChangedAgents = eventBus.getAgents(CRMEvent.STAGE_CHANGED);
  console.log('   Count:', stageChangedAgents.length);
  stageChangedAgents.forEach((agent, index) => {
    console.log(`   ${index + 1}. ${agent.constructor.name}`);
  });
  console.log('');

  // Check all registered events
  console.log('4. All Registered Events:');
  const events = [
    CRMEvent.LEAD_CREATED,
    CRMEvent.LEAD_UPDATED,
    CRMEvent.STAGE_CHANGED,
    CRMEvent.EMAIL_OPENED,
    CRMEvent.EMAIL_CLICKED,
    CRMEvent.TASK_COMPLETED,
    CRMEvent.CONTACT_CREATED,
  ];
  
  events.forEach(event => {
    const agents = eventBus.getAgents(event);
    if (agents.length > 0) {
      console.log(`   ${event}: ${agents.length} agent(s)`);
      agents.forEach(agent => {
        console.log(`     - ${agent.constructor.name}`);
      });
    }
  });
  console.log('');

  // Try to initialize if not initialized
  if (!agentRegistry.isInitialized()) {
    console.log('5. Attempting to Initialize Agent System...');
    try {
      await agentRegistry.registerAllAgents();
      console.log('   ✅ Agent system initialized successfully');
      console.log('');

      // Check again
      console.log('6. Agents After Initialization:');
      const stageChangedAgentsAfter = eventBus.getAgents(CRMEvent.STAGE_CHANGED);
      console.log('   STAGE_CHANGED agents:', stageChangedAgentsAfter.length);
      stageChangedAgentsAfter.forEach((agent, index) => {
        console.log(`   ${index + 1}. ${agent.constructor.name}`);
      });
    } catch (error) {
      console.log('   ❌ Failed to initialize:', error);
    }
  }

  console.log('\n=== End Diagnostic ===');
}

checkAgentSystem().catch(console.error);
