/**
 * Notification Center startup module.
 * Called once at server startup from instrumentation.ts.
 */
import { registerNotificationListener } from './notification-listener';
import { sseStreamManager } from './sse-stream-manager';

registerNotificationListener();
sseStreamManager.startPingLoop();

console.log('[Notifications] Listener registered and SSE ping loop started');
