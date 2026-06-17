// Next.js Instrumentation - Initialize agent system on server startup
// This file is automatically called by Next.js when the server starts

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only initialize on Node.js runtime (not Edge)
    const { initializeAgentSystem } = await import('./lib/agents/init');
    await initializeAgentSystem();

    // Initialize Notification Center: register event bus listener + SSE ping loop
    await import('./lib/notifications/index');
  }
}
