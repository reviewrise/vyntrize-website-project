// Agent System Initialization - Initialize agents on application startup

import { agentRegistry } from './registry';

let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the agent system
 * This should be called once during application startup
 */
export async function initializeAgentSystem(): Promise<void> {
  // Prevent multiple initializations
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('[AgentSystem] Initializing agent system...');

      // Check required environment variables
      // Note: OPENAI_API_KEY and GEMINI_API_KEY are optional - agents will work without AI providers
      const requiredEnvVars = ['REDIS_HOST', 'REDIS_PORT'];
      const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingEnvVars.length > 0) {
        console.warn(
          `[AgentSystem] Missing environment variables: ${missingEnvVars.join(', ')}. Agent system will be disabled.`
        );
        return;
      }

      // Warn about missing AI provider keys (but don't block initialization)
      if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
        console.warn('[AgentSystem] No AI provider keys configured. AI-powered agents (Email Generation, Next Best Action) will not be available.');
      }

      // Register all agents
      await agentRegistry.registerAllAgents();

      console.log('[AgentSystem] Agent system initialized successfully');
    } catch (error) {
      console.error('[AgentSystem] Failed to initialize agent system:', error);
      // Don't throw - allow app to start even if agents fail to initialize
    }
  })();

  return initializationPromise;
}

/**
 * Check if agent system is initialized
 */
export function isAgentSystemInitialized(): boolean {
  return agentRegistry.isInitialized();
}
