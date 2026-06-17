import { getSession } from '@/lib/session';
import { sseStreamManager } from '@/lib/notifications/sse-stream-manager';

export const dynamic = 'force-dynamic';

// GET /api/notifications/stream — SSE stream for real-time notifications
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.isLoggedIn) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.userId as string;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      sseStreamManager.addConnection(userId, controller);

      request.signal.addEventListener('abort', () => {
        sseStreamManager.removeConnection(userId, controller);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx/Caddy response buffering
    },
  });
}
