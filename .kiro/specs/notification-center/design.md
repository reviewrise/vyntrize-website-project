# Notification Center — Technical Design

## Overview

The Notification Center delivers real-time, persistent alerts to CRM users without requiring page reloads. It integrates with the existing `AgentEventBus`, writes notification records to PostgreSQL, pushes via SSE to connected clients, and optionally emails via the existing `emailService`. See Section 1 for the full architecture narrative.

## Architecture

See Section 1 (Overview) for the end-to-end data flow diagram. Key components: `NotificationService` (server-side orchestrator), `SSEStreamManager` (in-process connection registry), `notification-listener.ts` (event bus subscriber), and the `NotificationBell` / `NotificationPanel` client components.

## Components and Interfaces

See Section 3 (NotificationService) for the full TypeScript interface, Section 5 (SSE Stream Manager) for the stream manager class, and Section 7 (UI Components) for client component props and contracts.

## Data Models

See Section 2 (Database Schema) for the `Notification` and `NotificationPreference` Prisma models, enums, indexes, and `CrmUser` relation additions.

## Error Handling

- **Notification failures never interrupt CRM operations.** All listener handlers are wrapped in `try/catch`; errors are logged and swallowed.
- **Email failures** are logged at WARN level. The in-app notification record is left unmodified. No automatic retry.
- **SSE push failures** (closed controller) are caught per-connection; the failed controller is removed from the registry.
- **Ownership violations** on single-record mutations return HTTP 404 (not 403) to avoid leaking record existence.
- **Missing preference rows** are treated as: IN_APP enabled, EMAIL disabled, SMS disabled — never throw.
- **`isEnabled` check** runs before the DB write, so no orphan notification records are created for disabled channels.

## Testing Strategy

- **Unit tests** for `NotificationService`: mock `prisma`, `emailService`, and `sseStreamManager`. Test each method, `isEnabled` defaults, cleanup rule thresholds, and the ownership guard returning 0 rows.
- **Integration tests** for API routes: use a test database, seed a user, assert response shape and status codes for happy paths and 401/404 cases.
- **Listener tests**: emit synthetic `CRMEvent` values on the event bus, assert `createNotification` is called with correct arguments for each event type and payload variant (with/without assigned user).
- **SSE tests**: open a `ReadableStream`, call `sseStreamManager.push()`, assert the encoded bytes contain the expected event name and JSON payload.
- **UI tests**: mock `fetch` and `EventSource` in `NotificationBell`, assert badge count increments on SSE event, assert polling starts on SSE error, assert polling stops on reconnect.
- **Seed/test flag**: pass `isSeedOrTest: true` in all test and seed calls to prevent email delivery during test runs.

---

## 1. Overview

The Notification Center delivers real-time, persistent alerts to CRM users without requiring page reloads or polling every few seconds. The data flow has four stages:

**Event capture → Service → Persistence + SSE push → UI**

1. The existing `AgentEventBus` singleton emits `CRMEvent` values whenever CRM state changes.
2. `notification-listener.ts` subscribes to those events at app startup. For each event it resolves the target user(s) and calls `NotificationService.createNotification()`.
3. `NotificationService` writes the record to PostgreSQL via Prisma, then calls `sseStreamManager.push()` to deliver the payload to any open SSE connections for that user. If the user has EMAIL enabled for the event type and `isSeedOrTest` is false, it also calls `emailService.sendEmail()`.
4. The browser receives the SSE event, increments the bell badge, and prepends the notification to the open panel. If SSE is unavailable the client falls back to 30-second polling of `GET /api/notifications/unread-count`.

The `AGENT_ACTION_PENDING` notification sits outside the event bus because `AgentAction` creation is a direct Prisma write in an API route, not an event. The API route that creates `AgentAction` records calls `notificationService.createNotification()` directly after the Prisma insert.

The `NotificationCenter` component in `components/NotificationCenter.tsx` is the current stub. It is replaced by the `NotificationBell` + `NotificationPanel` split described in Section 7, and `layout.tsx` imports `NotificationBell` in place of the existing import.

---

## 2. Database Schema

Add the following to `packages/@platform/vyntrize-db/prisma/schema.prisma`.

### New enums

```prisma
enum NotificationChannel {
  IN_APP
  EMAIL
  SMS
}

enum NotificationEventType {
  LEAD_CREATED
  STAGE_CHANGED
  TASK_CREATED
  TASK_COMPLETED
  CALENDAR_EVENT_CREATED
  CALENDAR_EVENT_UPDATED
  AGENT_ACTION_PENDING
  MEETING_ATTENDED
  MEETING_MISSED
}
```

### Notification model

```prisma
model Notification {
  id          String                @id @default(cuid())
  userId      String
  user        CrmUser               @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)
  eventType   NotificationEventType
  title       String                @db.VarChar(255)
  body        String?               @db.VarChar(2000)
  entityType  String?               // "lead" | "task" | "calendar_event" | "agent_action"
  entityId    String?
  channel     NotificationChannel   @default(IN_APP)
  isRead      Boolean               @default(false)
  isDismissed Boolean               @default(false)
  readAt      DateTime?
  createdAt   DateTime              @default(now())

  @@index([userId, isDismissed, isRead, createdAt(sort: Desc)])
  @@map("crm_notifications")
}
```

### NotificationPreference model

```prisma
model NotificationPreference {
  id        String                @id @default(cuid())
  userId    String
  user      CrmUser               @relation("UserNotificationPreferences", fields: [userId], references: [id], onDelete: Cascade)
  eventType NotificationEventType
  channel   NotificationChannel
  isEnabled Boolean               @default(true)
  createdAt DateTime              @default(now())
  updatedAt DateTime              @updatedAt

  @@unique([userId, eventType, channel])
  @@map("crm_notification_preferences")
}
```

### CrmUser additions

Add two relation fields to the existing `CrmUser` model:

```prisma
model CrmUser {
  // ... existing fields ...

  notifications            Notification[]           @relation("UserNotifications")
  notificationPreferences  NotificationPreference[] @relation("UserNotificationPreferences")
}
```

### Index rationale

The compound index `(userId, isDismissed, isRead, createdAt DESC)` covers the primary feed query — non-dismissed notifications for a user ordered by recency — with a single index scan. The `createdAt(sort: Desc)` directive requires Prisma 4.5+ and PostgreSQL 13+, both of which are satisfied by the existing stack.

---

## 3. NotificationService

**File:** `apps/vyntrize-crm/lib/notifications/notification-service.ts`

### Types

```typescript
import { NotificationEventType, NotificationChannel, Notification, NotificationPreference } from '@platform/vyntrize-db';

export interface CreateNotificationInput {
  userId: string;
  eventType: NotificationEventType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  isSeedOrTest?: boolean;
}

export interface PreferenceInput {
  eventType: NotificationEventType;
  channel: NotificationChannel;
  isEnabled: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface CleanupResult {
  dismissedOld: number;  // isDismissed + >30d
  readOld: number;       // isRead + >90d
  ancient: number;       // >180d regardless of state
}
```

### Class skeleton

```typescript
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/email-service';
import { sseStreamManager } from './sse-stream-manager';

class NotificationService {
  /** Create a notification and deliver it via all enabled channels. */
  async createNotification(input: CreateNotificationInput): Promise<void>

  /** Paginated list of non-dismissed notifications, newest first. */
  async getNotifications(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<Notification>>

  /** Count of non-dismissed, unread notifications. */
  async getUnreadCount(userId: string): Promise<number>

  /** Set isRead=true and readAt=now() for a single notification owned by userId. */
  async markAsRead(notificationId: string, userId: string): Promise<void>

  /** Mark all unread, non-dismissed notifications as read for a user. */
  async markAllAsRead(userId: string): Promise<void>

  /** Set isDismissed=true for a single notification owned by userId. */
  async dismiss(notificationId: string, userId: string): Promise<void>

  /** Dismiss all non-dismissed notifications for a user. */
  async dismissAll(userId: string): Promise<void>

  /** Return all preference rows for a user (missing rows = defaults apply). */
  async getPreferences(userId: string): Promise<NotificationPreference[]>

  /** Upsert an array of preference inputs for a user (max 100 per call). */
  async upsertPreferences(userId: string, prefs: PreferenceInput[]): Promise<void>

  /** Run the three retention rules and return deleted counts per rule. */
  async runCleanup(): Promise<CleanupResult>

  /** Return true when a preference row is enabled or absent (defaults to true for IN_APP, false for EMAIL). */
  private async isEnabled(
    userId: string,
    eventType: NotificationEventType,
    channel: NotificationChannel,
  ): Promise<boolean>

  /** Query all active CrmUser IDs with role=ADMIN. */
  private async getAdminUserIds(): Promise<string[]>
}

export const notificationService = new NotificationService();
```

### `createNotification` flow

```
createNotification(input)
  │
  ├─ 1. isEnabled(userId, eventType, IN_APP)
  │        └─ false → return (skip silently)
  │
  ├─ 2. prisma.notification.create(...)
  │        → record in crm_notifications
  │
  ├─ 3. sseStreamManager.push(userId, notification)
  │        → encodes as SSE event and writes to all open
  │          ReadableStreamControllers for this userId
  │
  └─ 4. if !isSeedOrTest && isEnabled(userId, eventType, EMAIL)
           → fetch user.email from DB
           → if email present:
               emailService.sendEmail({
                 to: user.email,
                 subject: input.title,
                 html: buildNotificationEmailHtml(input),
                 role: 'admin',
                 skipLayout: false,
               })
               // on failure: log error, do NOT throw, do NOT retry
           → if no email: log warning, skip
```

**Default preference resolution** (inside `isEnabled`): query `NotificationPreference` for the `(userId, eventType, channel)` triple. If no row exists, `IN_APP` defaults to `true`, `EMAIL` defaults to `false`, `SMS` defaults to `false`.

**Ownership guard** on `markAsRead`, `dismiss`: the Prisma `where` clause includes both `id` and `userId`. If `updateMany` returns `count: 0`, the service throws a `NotFoundError` which the route handler maps to HTTP 404.

---

## 4. Event Bus Listener

**File:** `apps/vyntrize-crm/lib/notifications/notification-listener.ts`

The listener subscribes to `AgentEventBus` using the existing `on()` method inherited from Node.js `EventEmitter`. Registration happens once at app startup (see Section 11).

```typescript
import { eventBus, CRMEvent, EventPayload } from '@/lib/agents/event-bus';
import { notificationService } from './notification-service';
import { NotificationEventType } from '@platform/vyntrize-db';

export function registerNotificationListener(): void {
  eventBus.on(CRMEvent.LEAD_CREATED, handleLeadCreated);
  eventBus.on(CRMEvent.STAGE_CHANGED, handleStageChanged);
  eventBus.on(CRMEvent.TASK_CREATED, handleTaskCreated);
  eventBus.on(CRMEvent.TASK_COMPLETED, handleTaskCompleted);
  eventBus.on(CRMEvent.CALENDAR_EVENT_CREATED, handleCalendarEvent);
  eventBus.on(CRMEvent.CALENDAR_EVENT_UPDATED, handleCalendarEvent);
  eventBus.on(CRMEvent.MEETING_ATTENDED, handleMeetingAttended);
  eventBus.on(CRMEvent.MEETING_MISSED, handleMeetingMissed);
}
```

### Event → target user mapping

| CRMEvent | Target user(s) | Title template |
|---|---|---|
| `LEAD_CREATED` | Assigned user (if set) + all ADMINs | `"New lead: {lead.title}"` |
| `STAGE_CHANGED` | Assigned user (if set) | `"Lead moved: {prev} → {new}"` |
| `TASK_CREATED` | `payload.metadata.assignedToId` | `"New task assigned: {task.title}"` |
| `TASK_COMPLETED` | `payload.metadata.createdById` | `"Task completed: {task.title}"` |
| `CALENDAR_EVENT_CREATED` | `payload.userId` | `"New calendar event: {event.title}"` |
| `CALENDAR_EVENT_UPDATED` | `payload.userId` | `"Calendar event updated: {event.title}"` |
| `MEETING_ATTENDED` | `payload.userId` | `"Meeting attended: {event.title}"` |
| `MEETING_MISSED` | `payload.userId` | `"Meeting missed: {event.title}"` |
| `AGENT_ACTION_PENDING` (direct) | All ADMINs | `"Agent action requires review"` |

**Payload resolution notes:**
- `LEAD_CREATED`: assigned user ID comes from `payload.metadata.assigneeId`; lead title from `payload.metadata.leadTitle`. If `assigneeId` is absent, skip the per-user notification and notify ADMINs only.
- `STAGE_CHANGED`: previous stage in `payload.previousValue`, new stage in `payload.newValue`. If no assigned user, log a warning and skip (per requirements §2.4).
- `TASK_CREATED` / `TASK_COMPLETED`: task ID from `payload.taskId`; title from `payload.metadata.taskTitle`.
- If the resolved `userId` is null/undefined, log a warning and skip the notification (per requirements §2.9).

All handlers are `async` and wrapped in `try/catch`; errors are logged but never re-thrown — a notification failure must never interrupt the primary CRM operation that emitted the event.

---

## 5. SSE Stream Manager

**File:** `apps/vyntrize-crm/lib/notifications/sse-stream-manager.ts`

Next.js App Router does not support WebSockets natively. SSE over `ReadableStream` is the correct pattern for unidirectional server → client push without an external WebSocket server.

```typescript
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

  /** Send a keep-alive ping to every open connection every 30 seconds. */
  startPingLoop(): void {
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
```

The ping uses the SSE comment syntax (`: ping\n\n`) rather than a named event, so browsers ignore it while proxy servers and load balancers reset their idle timeouts.

---

## 6. API Routes

All routes live under `apps/vyntrize-crm/app/api/notifications/`. Every handler reads the session via `getSession()` (the existing `lib/session.ts` helper) and returns HTTP 401 if `!session.isLoggedIn`. The `notificationService` singleton is imported directly.

### Route table

| File | Method | Description |
|---|---|---|
| `route.ts` | GET | Paginated non-dismissed notifications. Query params: `page` (default 1), `pageSize` (default 20, max 50). Response: `PaginatedResult<Notification>`. |
| `unread-count/route.ts` | GET | Returns `{ count: number }`. |
| `stream/route.ts` | GET | SSE stream endpoint (see below). |
| `read-all/route.ts` | PATCH | Marks all unread, non-dismissed notifications read. Returns 204. |
| `dismiss-all/route.ts` | PATCH | Sets `isDismissed=true` on all non-dismissed notifications. Returns 204. |
| `preferences/route.ts` | GET | Returns `NotificationPreference[]` for the user. |
| `preferences/route.ts` | PUT | Accepts `{ preferences: PreferenceInput[] }` (max 100). Upserts. Returns 204. Returns 400 if any entry has an unrecognized `eventType` or `channel`. |
| `[id]/read/route.ts` | PATCH | Marks one notification read. Returns 204. Returns 404 if not found or not owned by caller. |
| `[id]/dismiss/route.ts` | PATCH | Dismisses one notification. Returns 204. Returns 404 if not found or not owned by caller. |

### SSE route handler pattern

```typescript
// app/api/notifications/stream/route.ts
import { getSession } from '@/lib/session';
import { sseStreamManager } from '@/lib/notifications/sse-stream-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.userId;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      sseStreamManager.addConnection(userId, controller);

      request.signal.addEventListener('abort', () => {
        sseStreamManager.removeConnection(userId, controller);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx response buffering
    },
  });
}
```

`export const dynamic = 'force-dynamic'` prevents Next.js from statically rendering or caching the SSE route. The `X-Accel-Buffering: no` header is required when the app runs behind the Nginx/Caddy reverse proxy in production (see `deploy/docker-compose.yml`), otherwise the proxy buffers the stream and the client never receives events.

---

## 7. UI Components

All components live under `apps/vyntrize-crm/components/notifications/`. They follow the same CSS variable token system (`var(--color-surface)`, `var(--color-primary)`, etc.) and Lucide icon usage established throughout the CRM.

The existing `components/NotificationCenter.tsx` stub is **replaced** by the components below. `app/(crm)/layout.tsx` imports `NotificationBell` instead of `NotificationCenter`.

### 7.1 NotificationBell (`components/notifications/NotificationBell.tsx`)

Client component. Owns the bell icon, badge, and SSE connection lifecycle.

**State:**
- `unreadCount: number` — fetched from `GET /api/notifications/unread-count` on mount and after reconnect
- `sseStatus: 'connecting' | 'open' | 'closed' | 'polling'`

**SSE lifecycle:**
1. On mount, open `EventSource('/api/notifications/stream')`.
2. On `new_notification` event: increment `unreadCount` by 1.
3. On `error`: close the source. Start exponential back-off reconnect (initial 5s, doubles each attempt, max 60s, up to 10 attempts). On each failed attempt, fall back to polling interval if not already polling.
4. On successful reconnect: stop polling, re-fetch `unreadCount` to reconcile missed notifications.
5. On unmount: close `EventSource` and clear polling interval.

**Badge rules:**
- Count > 99 → renders `"99+"`.
- Count === 0 → no badge element rendered.

**Renders:**
```tsx
<button onClick={togglePanel} aria-label="Notifications" ...>
  <Bell className="h-4 w-4" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 ...">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )}
</button>
{panelOpen && <NotificationPanel onClose={() => setPanelOpen(false)} onRead={decrementCount} />}
```

`NotificationBell` passes an `onRead` callback so the panel can decrement the badge count when individual items are marked read, without needing a global state layer.

### 7.2 NotificationPanel (`components/notifications/NotificationPanel.tsx`)

Client component. Renders as an absolutely-positioned dropdown anchored to the bell, matching the existing panel style in `NotificationCenter.tsx`.

**On open:** fetches `GET /api/notifications?pageSize=20`, populates `notifications` state.

**SSE integration:** `NotificationBell` passes new notifications down via a `latestNotification` prop. When this prop changes, the panel prepends the new item to the list (if the panel is open).

**Actions:**
- "Mark all as read" → `PATCH /api/notifications/read-all` → update all items to read state in-place.
- "View all notifications" link → navigates to `/notifications`.
- Outside click → closes panel (via `useEffect` with `mousedown` listener, matching the existing stub pattern).

**Empty state:** `<Bell />` icon + `"You're all caught up"` message.

**Structure:**
```tsx
<div ref={panelRef} className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl ...">
  {/* Header */}
  <div>Notifications | Mark all read</div>
  {/* List */}
  <div className="max-h-96 overflow-y-auto">
    {notifications.map(n => (
      <NotificationItem key={n.id} notification={n} onRead={onRead} onDismiss={handleDismiss} />
    ))}
  </div>
  {/* Footer */}
  {notifications.length >= 20 && <Link href="/notifications">View all notifications</Link>}
</div>
```

### 7.3 NotificationItem (`components/notifications/NotificationItem.tsx`)

Pure presentational + action component.

**Props:** `notification: Notification`, `onRead: (id: string) => void`, `onDismiss: (id: string) => void`

**On click (item body):**
1. Call `PATCH /api/notifications/{id}/read`.
2. Call `onRead(id)` to update parent state.
3. If `entityType` and `entityId` are present, `router.push(ENTITY_ROUTES[entityType](entityId))`.

**Dismiss button (×):**
1. Call `PATCH /api/notifications/{id}/dismiss`.
2. Call `onDismiss(id)` to remove from parent list.

**Visual:**
- Unread: `backgroundColor: '{eventColor}08'` (8% opacity accent, same pattern as existing stub).
- Read: transparent background.
- Icon: from `notification-icons.ts` map (see Section 9).
- Timestamp: `timeAgo()` helper producing strings like `"3m ago"`, `"2h ago"`, `"4d ago"`.

### 7.4 NotificationPreferences (`components/notifications/NotificationPreferences.tsx`)

Client component. Rendered inside a sheet/drawer (using the existing `components/Drawer.tsx`) accessible from both the panel footer and the full notifications page.

**Layout:** Table with rows = `NotificationEventType` values, columns = `IN_APP` and `EMAIL` channels. Each cell is a toggle (`<input type="checkbox" />`).

**On mount:** fetches `GET /api/notifications/preferences`, builds a local state map `Record<NotificationEventType, Record<NotificationChannel, boolean>>`. Missing rows fill in with the defaults (IN_APP=true, EMAIL=false).

**Save flow:**
1. On toggle change, update local state immediately (optimistic).
2. Debounce 800ms, then call `PUT /api/notifications/preferences` with the full current state.
3. On error: revert the specific toggle to its pre-change value, show a toast error (using whatever toast library is in use — check `package.json` for `react-hot-toast` or `sonner`).

**SMS column:** rendered with a `disabled` state and a `"Coming soon"` tooltip. The column is structurally present so the SMS implementation only needs to remove `disabled` and wire the API call.

---

## 8. Full Notifications Page

**File:** `apps/vyntrize-crm/app/(crm)/notifications/page.tsx` (server component shell)
**Client component:** `app/(crm)/notifications/NotificationsClient.tsx`

The page server component handles session auth and passes initial data as props. The client component handles filtering, pagination, and mutations.

**Filters (client-side query params):**
- `filter=all` (default) — all non-dismissed
- `filter=unread` — `isRead=false` only
- `filter={NotificationEventType}` — single event type

**Pagination:** 25 items/page. Page controls rendered as `<button>` elements updating the `page` query param.

**"Dismiss all" flow:**
1. User clicks "Dismiss all".
2. Confirmation modal: `"This will remove all notifications from your feed. This cannot be undone."` with Cancel / Confirm buttons.
3. On confirm: `PATCH /api/notifications/dismiss-all`.
4. On success: clear list, show empty state.
5. On failure: display inline error, leave list unchanged.

**Preferences access:** "Notification Settings" button in the page header opens `NotificationPreferences` inside `Drawer`.

---

## 9. Entity Navigation Map

Used by `NotificationItem` to resolve a click on a notification with an `entityType`/`entityId` to the correct CRM route.

```typescript
// components/notifications/notification-icons.ts
import { Bell, UserPlus, GitBranch, CheckSquare, Calendar, Bot, Users, AlertTriangle } from 'lucide-react';
import { NotificationEventType } from '@platform/vyntrize-db';

export const NOTIFICATION_ICONS: Record<NotificationEventType, React.ElementType> = {
  LEAD_CREATED:           UserPlus,
  STAGE_CHANGED:          GitBranch,
  TASK_CREATED:           CheckSquare,
  TASK_COMPLETED:         CheckSquare,
  CALENDAR_EVENT_CREATED: Calendar,
  CALENDAR_EVENT_UPDATED: Calendar,
  AGENT_ACTION_PENDING:   Bot,
  MEETING_ATTENDED:       Users,
  MEETING_MISSED:         AlertTriangle,
};

export const NOTIFICATION_COLORS: Record<NotificationEventType, string> = {
  LEAD_CREATED:           '#6366f1',
  STAGE_CHANGED:          '#0ea5e9',
  TASK_CREATED:           '#8b5cf6',
  TASK_COMPLETED:         '#10b981',
  CALENDAR_EVENT_CREATED: '#f59e0b',
  CALENDAR_EVENT_UPDATED: '#f59e0b',
  AGENT_ACTION_PENDING:   '#ef4444',
  MEETING_ATTENDED:       '#10b981',
  MEETING_MISSED:         '#ef4444',
};

export const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  lead:           (id) => `/leads/${id}`,
  task:           (id) => `/leads?taskId=${id}`,
  calendar_event: (id) => `/calendar?eventId=${id}`,
  agent_action:   (id) => `/agents?actionId=${id}`,
};
```

---

## 10. File Structure

```
apps/vyntrize-crm/
  lib/notifications/
    index.ts                     # calls registerNotificationListener() + sseStreamManager.startPingLoop()
    notification-service.ts      # core service + singleton export
    notification-listener.ts     # event bus subscriptions
    sse-stream-manager.ts        # SSE connection registry + singleton export
    notification-cleanup.ts      # runCleanup() standalone entry point (for cron/manual invocation)

  app/api/notifications/
    route.ts                     # GET — paginated list
    unread-count/
      route.ts                   # GET — unread count
    stream/
      route.ts                   # GET — SSE stream
    read-all/
      route.ts                   # PATCH — mark all read
    dismiss-all/
      route.ts                   # PATCH — dismiss all
    preferences/
      route.ts                   # GET + PUT — preferences
    [id]/
      read/
        route.ts                 # PATCH — mark one read
      dismiss/
        route.ts                 # PATCH — dismiss one

  app/(crm)/notifications/
    page.tsx                     # Server component shell (auth check, initial data fetch)
    NotificationsClient.tsx      # Client component (filters, pagination, mutations)

  components/notifications/
    NotificationBell.tsx         # Bell icon + badge + SSE lifecycle
    NotificationPanel.tsx        # Dropdown panel
    NotificationItem.tsx         # Individual notification row
    NotificationPreferences.tsx  # Preferences table/grid
    notification-icons.ts        # eventType → Lucide icon + color + entity route maps

packages/@platform/vyntrize-db/prisma/
  schema.prisma                  # Notification + NotificationPreference models added
```

---

## Correctness Properties

These invariants must hold at all times and should be verified in tests:

### Property 1: Ownership isolation
`markAsRead(id, userId)` and `dismiss(id, userId)` only update rows where both `id` and `userId` match. A user can never read or dismiss another user's notification.

**Validates: Requirements 3.3, 3.5, 3.9**

### Property 2: No duplicate delivery
`createNotification` is called once per target user per event. Admin users who are also the lead assignee receive exactly one notification for `LEAD_CREATED`, not two.

**Validates: Requirements 2.1, 2.2**

### Property 3: Default preference correctness
When no `NotificationPreference` row exists for `(userId, eventType, IN_APP)`, `isEnabled` returns `true`. When no row exists for `(userId, eventType, EMAIL)`, `isEnabled` returns `false`.

**Validates: Requirements 2.10, 8.4**

### Property 4: Seed/test isolation
When `isSeedOrTest: true`, `emailService.sendEmail()` is never called regardless of user preferences.

**Validates: Requirements 9.7**

### Property 5: SSE fan-out completeness
`sseStreamManager.push(userId, n)` delivers to all open controllers for `userId`, not just the first one. A user with two open browser tabs receives the notification in both.

**Validates: Requirements 4.1, 4.2**

### Property 6: Failed SSE controllers cleaned up
After a `controller.enqueue()` throws, the dead controller is removed from the set and never written to again.

**Validates: Requirements 4.3**

### Property 7: Cleanup idempotence
Running `runCleanup()` twice in succession produces a `CleanupResult` with all-zero counts on the second call (no double-deletes, no errors).

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 8: Read count monotonicity
`getUnreadCount(userId)` always equals the count of rows where `userId = userId AND isRead = false AND isDismissed = false`.

**Validates: Requirements 3.2, 5.2**

### Property 9: readAt set only on read transition
`readAt` is set to a non-null timestamp exactly when `isRead` transitions from `false` to `true`. Dismissing without reading leaves `readAt` null.

**Validates: Requirements 1.1, 3.3**

### Property 10: Preference upsert atomicity
A `PUT /api/notifications/preferences` call with N items either persists all N or none (wrapped in a Prisma `$transaction`). Partial failures return 500 and roll back.

**Validates: Requirements 8.5**

---

## 11. Integration Points

### Nav bar

`app/(crm)/layout.tsx` currently imports `NotificationCenter` from `components/NotificationCenter.tsx`. Replace this import with `NotificationBell` from `components/notifications/NotificationBell.tsx`. The existing stub file can be deleted once the new components are in place.

```tsx
// app/(crm)/layout.tsx — diff
- import { NotificationCenter } from '@/components/NotificationCenter';
+ import { NotificationBell } from '@/components/notifications/NotificationBell';

// in JSX:
- <NotificationCenter />
+ <NotificationBell />
```

### Startup registration

`lib/notifications/index.ts` must be imported exactly once during app initialization to register the event listener and start the SSE ping loop. The correct place is the Next.js instrumentation file:

```typescript
// instrumentation.ts (Next.js 14 App Router)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/notifications/index');
  }
}
```

This runs once in the Node.js runtime at server startup, not on each request. The `process.env.NEXT_RUNTIME === 'nodejs'` guard prevents execution in the Edge runtime.

If `instrumentation.ts` does not exist yet, create it at the root of `apps/vyntrize-crm/`. Also set `experimental.instrumentationHook: true` in `next.config.ts` (required in Next.js 14; it is built-in from Next.js 15).

### AgentAction hook

`AGENT_ACTION_PENDING` is not emitted by `AgentEventBus`. The notification is triggered directly from the API route that writes `AgentAction` records:

```typescript
// app/api/agents/actions/route.ts (or wherever AgentAction is created)
const action = await prisma.agentAction.create({ data: { ... } });

if (
  action.status === 'PENDING' &&
  (action.autonomyLevel === 'SUGGEST_APPROVE' || action.autonomyLevel === 'COPILOT')
) {
  // Fire and forget — never await notifications in the critical path
  notificationService
    .createNotificationsForAdmins({
      eventType: NotificationEventType.AGENT_ACTION_PENDING,
      title: 'Agent action requires review',
      body: action.reasoning.slice(0, 200),
      entityType: 'agent_action',
      entityId: action.id,
    })
    .catch((err) => console.error('[Notifications] AgentAction hook failed:', err));
}
```

`createNotificationsForAdmins` is a convenience wrapper on `NotificationService` that calls `getAdminUserIds()` and iterates `createNotification()` for each.

---

## 12. SMS Channel Forward Compatibility

The `NotificationChannel` enum includes `SMS` from day one. No schema migration is needed when SMS is implemented.

**What changes when SMS is added:**

1. Add `lib/sms/sms-service.ts` with a `sendSms(to: string, body: string): Promise<SmsResult>` interface.
2. In `NotificationService.createNotification()`, add a block after the email block:
   ```typescript
   if (!input.isSeedOrTest && await this.isEnabled(userId, eventType, NotificationChannel.SMS)) {
     const user = await prisma.crmUser.findUnique({ where: { id: userId } });
     if (user?.phone) {
       await smsService.sendSms(user.phone, input.body ?? input.title);
     } else {
       console.warn(`[NotificationService] SMS enabled but no phone for user ${userId}`);
     }
   }
   ```
3. In `NotificationPreferences.tsx`, remove `disabled` from the SMS column toggle.
4. Default preference for SMS (absent row) remains `false` — no data backfill needed.

No changes to the `Notification` or `NotificationPreference` schema are required.
