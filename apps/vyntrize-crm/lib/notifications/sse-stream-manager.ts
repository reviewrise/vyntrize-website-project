import { Notification } from '@platform/vyntrize-db';

class SSEStreamManager {
  private connections: Map<string, Set<ReadableStreamDefaultController<Uint8Array>>> = new Map();
  private encoder = new TextEncoder();

  addConnection(userId: string, controller: ReadableStreamDefaultController<Uint8Array>): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(controller);
  }

  removeConnection(userId: string, controller: ReadableStreamDefaultController<Uint8Array>): void {
    const set = this.connections.get(userId);
    if (!set) return;
    set.delete(controller);
    if (set.size === 0) this.connections.delete(userId);
  }

  push(userId: string, notification: Notification): void {
    const set = this.connections.get(userId);
    if (!set || set.size === 0) return;
    const payload = `event: new_notification\ndata: ${JSON.stringify(notification)}\n\n`;
    const encoded = this.encoder.encode(payload);
    for (const controller of set) {
      try {
        controller.enqueue(encoded);
      } catch {
        // Controller already closed; remove it
        set.delete(controller);
      }
    }
  }

  private pingStarted = false;

  /** Send a keep-alive ping to every open connection every 30 seconds. */
  startPingLoop(): void {
    if (this.pingStarted) return;
    this.pingStarted = true;
    setInterval(() => {
      const ping = this.encoder.encode(': ping\n\n');
      for (const set of this.connections.values()) {
        for (const controller of set) {
          try { controller.enqueue(ping); } catch { /* closed */ }
        }
      }
    }, 30_000);
  }
}

export const sseStreamManager = new SSEStreamManager();
