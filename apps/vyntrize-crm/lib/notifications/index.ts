/**
 * Notification Center startup module.
 * Called once at server startup from instrumentation.ts.
 */
import { registerNotificationListener } from './notification-listener';
import { sseStreamManager } from './sse-stream-manager';

registerNotificationListener();
sseStreamManager.startPingLoop();

console.log('[NotificationCenter] Listener registered and ping loop started');
