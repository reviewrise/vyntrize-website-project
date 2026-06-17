# Implementation Plan: Notification Center

## Overview

Implement a real-time, persistent notification system for the Vyntrize CRM. The implementation follows a bottom-up approach: database schema → server-side service and SSE infrastructure → API routes → event bus listener → UI components → full notifications page. The existing `NotificationCenter.tsx` stub is replaced by the new split architecture (`NotificationBell` + `NotificationPanel`).

## Tasks

- [x] 1. Database schema — add Notification models to Prisma
  - [x] 1.1 Add `NotificationChannel` and `NotificationEventType` enums to `packages/@platform/vyntrize-db/prisma/schema.prisma`
    - Add `NotificationChannel { IN_APP EMAIL SMS }` enum
    - Add `NotificationEventType` enum with all 9 values from design §2
    - _Requirements: 1.1, 1.3_
  - [x] 1.2 Add `Notification` and `NotificationPreference` models and update `CrmUser` relations
    - Add `Notification` model with all fields, compound index, and `@@map("crm_notifications")`
    - Add `NotificationPreference` model with unique constraint and `@@map("crm_notification_preferences")`
    - Add `notifications` and `notificationPreferences` relation fields to `CrmUser`
    - _Requirements: 1.1, 1.2, 1.4_
  - [x] 1.3 Generate and run Prisma migration for notification tables
    - Run `prisma migrate dev --name add_notification_center` in `packages/@platform/vyntrize-db`
    - Regenerate the Prisma client (`prisma generate`)
    - _Requirements: 1.1, 1.2_

- [x] 2. SSE Stream Manager
  - [x] 2.1 Create `apps/vyntrize-crm/lib/notifications/sse-stream-manager.ts`
    - Implement `SSEStreamManager` class with `connections: Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>`
    - Implement `addConnection(userId, controller)`, `removeConnection(userId, controller)`, and `push(userId, notification)` methods
    - Implement `startPingLoop()` that enqueues `': ping\n\n'` SSE comment every 30 seconds
    - Export `sseStreamManager` singleton
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 2.2 Write property test for SSE fan-out completeness (Property 5)
    - **Property 5: SSE fan-out completeness**
    - Verify `push(userId, n)` calls `enqueue` on all controllers registered for `userId`, not just the first
    - **Validates: Requirements 4.1, 4.2**
  - [ ]* 2.3 Write property test for failed SSE controller cleanup (Property 6)
    - **Property 6: Failed SSE controllers cleaned up**
    - Verify that a controller whose `enqueue()` throws is removed from the set and skipped on subsequent calls
    - **Validates: Requirements 4.3**

- [ ] 3. NotificationService — core implementation
  - [x] 3.1 Create `apps/vyntrize-crm/lib/notifications/notification-service.ts` with types and class skeleton
    - Define and export `CreateNotificationInput`, `PreferenceInput`, `PaginatedResult<T>`, and `CleanupResult` interfaces
    - Define `NotFoundError` class for ownership-guard failures
    - Scaffold `NotificationService` class with all method signatures from design §3
    - Export `notificationService` singleton
    - _Requirements: 1.1, 1.2, 3.1_
  - [x] 3.2 Implement `isEnabled` private method and `createNotification`
    - Implement `isEnabled(userId, eventType, channel)`: query `NotificationPreference`; default IN_APP=true, EMAIL=false, SMS=false when row absent
    - Implement `createNotification(input)`: `isEnabled` check → `prisma.notification.create` → `sseStreamManager.push` → conditional `emailService.sendEmail` (wrap all in try/catch, never throw)
    - Implement `buildNotificationEmailHtml(input)` helper that includes entity link when `entityType`/`entityId` present
    - _Requirements: 2.10, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  - [ ]* 2.4 Write property test for default preference correctness (Property 3)
    - **Property 3: Default preference correctness**
    - Verify absent IN_APP row returns `true`, absent EMAIL row returns `false`
    - **Validates: Requirements 2.10, 8.4**
  - [ ]* 2.5 Write property test for seed/test isolation (Property 4)
    - **Property 4: Seed/test isolation**
    - Verify `emailService.sendEmail` is never called when `isSeedOrTest: true`, regardless of preferences
    - **Validates: Requirements 9.7**
  - [x] 3.3 Implement `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`
    - `getNotifications`: paginated query `where: { userId, isDismissed: false }`, order by `createdAt desc`, return `PaginatedResult<Notification>`
    - `getUnreadCount`: count `where: { userId, isDismissed: false, isRead: false }`
    - `markAsRead`: `updateMany` with `{ id, userId }` where clause; throw `NotFoundError` if `count === 0`; set `readAt: new Date()`
    - `markAllAsRead`: `updateMany` with `{ userId, isRead: false, isDismissed: false }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 3.4 Write property test for ownership isolation (Property 1)
    - **Property 1: Ownership isolation**
    - Verify `markAsRead(id, userB)` returns `NotFoundError` when notification belongs to `userA`
    - **Validates: Requirements 3.3, 3.5, 3.9**
  - [ ]* 3.5 Write property test for read count monotonicity (Property 8)
    - **Property 8: Read count monotonicity**
    - Verify `getUnreadCount(userId)` always equals `SELECT COUNT(*) WHERE userId=? AND isRead=false AND isDismissed=false`
    - **Validates: Requirements 3.2, 5.2**
  - [ ]* 3.6 Write property test for readAt set only on read transition (Property 9)
    - **Property 9: readAt set only on read transition**
    - Verify `readAt` is non-null only after `isRead` transitions false→true; dismissing without reading leaves `readAt` null
    - **Validates: Requirements 1.1, 3.3**
  - [x] 3.7 Implement `dismiss`, `dismissAll`, `getPreferences`, `upsertPreferences`, `getAdminUserIds`, `createNotificationsForAdmins`
    - `dismiss`: `updateMany` with `{ id, userId }`; throw `NotFoundError` if `count === 0`
    - `dismissAll`: `updateMany` with `{ userId, isDismissed: false }`
    - `getPreferences`: find all rows for `userId`
    - `upsertPreferences`: validate max 100 items; wrap in `prisma.$transaction`; upsert each `(userId, eventType, channel)` triple
    - `getAdminUserIds`: query `CrmUser` where `role === ADMIN` and `isActive === true`
    - `createNotificationsForAdmins`: call `getAdminUserIds()` and iterate `createNotification()` for each
    - _Requirements: 3.5, 3.6, 3.7, 8.1, 8.2, 8.3, 8.5, 2.1, 2.8_
  - [ ]* 3.8 Write property test for preference upsert atomicity (Property 10)
    - **Property 10: Preference upsert atomicity**
    - Verify that if the Prisma `$transaction` fails mid-way, no partial preference rows are persisted
    - **Validates: Requirements 8.5**

- [ ] 4. Notification Cleanup
  - [x] 4.1 Implement `runCleanup` in `NotificationService` and create `apps/vyntrize-crm/lib/notifications/notification-cleanup.ts`
    - Implement `runCleanup()`: delete `isDismissed=true AND createdAt < 30d` → delete `isRead=true AND createdAt < 90d` → delete `createdAt < 180d`; log counts for each rule; log error if any rule fails; leave unprocessed records unmodified on failure
    - Create `notification-cleanup.ts` as a standalone entry point that imports and calls `notificationService.runCleanup()` (for cron/manual invocation)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ]* 4.2 Write property test for cleanup idempotence (Property 7)
    - **Property 7: Cleanup idempotence**
    - Run `runCleanup()` twice; verify second call returns all-zero `CleanupResult` counts
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ] 5. Checkpoint — core service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Event Bus Listener
  - [x] 6.1 Create `apps/vyntrize-crm/lib/notifications/notification-listener.ts`
    - Subscribe to all 8 `CRMEvent` values using `eventBus.on()`
    - Implement handler for each event type using target-user mapping from design §4
    - `LEAD_CREATED`: notify assigned user (if set) + all ADMINs via `createNotificationsForAdmins`; deduplicate so admin who is also assignee gets exactly one notification
    - `STAGE_CHANGED`: notify assigned user only; log warning and skip if no assigned user
    - `TASK_CREATED`: notify `payload.metadata.assignedToId`
    - `TASK_COMPLETED`: notify `payload.metadata.createdById`
    - `CALENDAR_EVENT_CREATED` / `CALENDAR_EVENT_UPDATED`: notify `payload.userId`
    - `MEETING_ATTENDED` / `MEETING_MISSED`: notify `payload.userId`
    - Wrap all handlers in async `try/catch`; log errors, never re-throw
    - Log warning and skip when resolved `userId` is null/undefined
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9_
  - [ ]* 6.2 Write property test for no duplicate delivery (Property 2)
    - **Property 2: No duplicate delivery**
    - Verify `LEAD_CREATED` with an admin as assignee calls `createNotification` exactly once for that user (deduplication)
    - **Validates: Requirements 2.1, 2.2**
  - [ ]* 6.3 Write unit tests for notification-listener event handlers
    - Mock `notificationService`, emit synthetic `CRMEvent` values on the bus
    - Assert `createNotification` called with correct `eventType`, `title`, `userId` for each event type
    - Test both "assigned user present" and "no assigned user" branches for LEAD_CREATED and STAGE_CHANGED
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [ ] 7. Startup registration and instrumentation
  - [x] 7.1 Create `apps/vyntrize-crm/lib/notifications/index.ts` and update `instrumentation.ts`
    - Create `lib/notifications/index.ts`: call `registerNotificationListener()` and `sseStreamManager.startPingLoop()`
    - Update existing `apps/vyntrize-crm/instrumentation.ts` `register()` function to also import `'./lib/notifications/index'` within the `process.env.NEXT_RUNTIME === 'nodejs'` guard (preserve existing `initializeAgentSystem` call)
    - _Requirements: 2.1, 4.4_

- [ ] 8. API Routes
  - [x] 8.1 Create `apps/vyntrize-crm/app/api/notifications/route.ts` (GET — paginated list)
    - Authenticate via `getSession()`; return 401 if not logged in
    - Parse `page` (default 1) and `pageSize` (default 20, cap 50) from query params
    - Call `notificationService.getNotifications(userId, page, pageSize)` and return `PaginatedResult<Notification>` as JSON
    - _Requirements: 3.1, 3.8_
  - [x] 8.2 Create `apps/vyntrize-crm/app/api/notifications/unread-count/route.ts` (GET)
    - Authenticate; call `notificationService.getUnreadCount(userId)`; return `{ count: number }`
    - _Requirements: 3.2, 3.8_
  - [x] 8.3 Create `apps/vyntrize-crm/app/api/notifications/stream/route.ts` (GET — SSE)
    - Export `dynamic = 'force-dynamic'`
    - Authenticate; return 401 if not logged in without opening stream
    - Create `ReadableStream`, call `sseStreamManager.addConnection` on `start`, `removeConnection` on `request.signal` abort
    - Return `Response(stream)` with `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`
    - _Requirements: 4.1, 4.3, 4.7_
  - [x] 8.4 Create bulk-action routes: `read-all/route.ts` and `dismiss-all/route.ts`
    - `PATCH /api/notifications/read-all`: authenticate; call `notificationService.markAllAsRead(userId)`; return 204
    - `PATCH /api/notifications/dismiss-all`: authenticate; call `notificationService.dismissAll(userId)`; return 204
    - _Requirements: 3.4, 3.8_
  - [x] 8.5 Create `apps/vyntrize-crm/app/api/notifications/preferences/route.ts` (GET + PUT)
    - `GET`: authenticate; call `notificationService.getPreferences(userId)`; return `NotificationPreference[]`
    - `PUT`: authenticate; parse `{ preferences: PreferenceInput[] }`; validate max 100 items and that each `eventType` and `channel` value is recognized; return 400 with message if invalid; call `notificationService.upsertPreferences(userId, preferences)`; return 204
    - _Requirements: 3.6, 3.7, 3.8_
  - [x] 8.6 Create per-notification routes: `[id]/read/route.ts` and `[id]/dismiss/route.ts`
    - `PATCH /api/notifications/[id]/read`: authenticate; call `notificationService.markAsRead(id, userId)`; catch `NotFoundError` and return 404; return 204 on success
    - `PATCH /api/notifications/[id]/dismiss`: authenticate; call `notificationService.dismiss(id, userId)`; catch `NotFoundError` and return 404; return 204 on success
    - _Requirements: 3.3, 3.5, 3.8, 3.9_
  - [ ]* 8.7 Write integration tests for API routes
    - Test 401 for unauthenticated requests on all `/api/notifications` endpoints
    - Test 404 for `PATCH /api/notifications/:id/read` and `PATCH /api/notifications/:id/dismiss` with a foreign notification ID
    - Test 400 for `PUT /api/notifications/preferences` with unrecognized `eventType`
    - Test happy-path response shapes for GET list, unread-count, and preferences
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ] 9. Checkpoint — API routes and service integration verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. UI — Shared icons/utilities
  - [x] 10.1 Create `apps/vyntrize-crm/components/notifications/notification-icons.ts`
    - Define and export `NOTIFICATION_ICONS: Record<NotificationEventType, React.ElementType>` using Lucide icons from design §9
    - Define and export `NOTIFICATION_COLORS: Record<NotificationEventType, string>` with hex values from design §9
    - Define and export `ENTITY_ROUTES: Record<string, (id: string) => string>` for lead, task, calendar_event, agent_action
    - Export `timeAgo(date: string | Date): string` helper producing "3m ago" / "2h ago" / "4d ago" / "just now" strings
    - _Requirements: 6.2, 6.3_

- [x] 11. UI — NotificationItem component
  - [x] 11.1 Create `apps/vyntrize-crm/components/notifications/NotificationItem.tsx`
    - Accept props: `notification: Notification`, `onRead: (id: string) => void`, `onDismiss: (id: string) => void`
    - On item body click: call `PATCH /api/notifications/{id}/read`, call `onRead(id)`, navigate via `router.push(ENTITY_ROUTES[entityType](entityId))` if entity present
    - On dismiss (×) button click: call `PATCH /api/notifications/{id}/dismiss`, call `onDismiss(id)`
    - Apply unread background `{eventColor}08`, read transparent; use icon and color from `NOTIFICATION_ICONS`/`NOTIFICATION_COLORS`; render `timeAgo()` timestamp
    - _Requirements: 6.2, 6.3, 6.4, 6.6_

- [x] 12. UI — NotificationPanel component
  - [x] 12.1 Create `apps/vyntrize-crm/components/notifications/NotificationPanel.tsx`
    - Accept props: `onClose: () => void`, `onRead: (id: string) => void`, `latestNotification?: Notification`
    - On open: fetch `GET /api/notifications?pageSize=20`; maintain `notifications` state
    - When `latestNotification` prop changes: prepend to list (if panel is open)
    - Render header with "Mark all as read" button → `PATCH /api/notifications/read-all` → update all items to read in-place
    - Render list of `<NotificationItem>` with `onDismiss` handler that removes from list
    - Render empty state (`<Bell>` icon + "You're all caught up") when list is empty
    - Render "View all notifications" `<Link href="/notifications">` footer when list has 20 items
    - Use `useEffect` + `mousedown` listener for outside-click close (matching existing stub pattern)
    - _Requirements: 6.1, 6.5, 6.7, 6.8, 6.9, 6.10_
  - [ ]* 12.2 Write unit tests for NotificationPanel
    - Mock `fetch` and assert correct API calls for "mark all as read" and dismiss actions
    - Assert empty state renders when notification list is empty
    - Assert new notification prepended when `latestNotification` prop changes
    - _Requirements: 6.5, 6.7, 6.10_

- [x] 13. UI — NotificationBell component
  - [x] 13.1 Create `apps/vyntrize-crm/components/notifications/NotificationBell.tsx`
    - On mount: fetch `GET /api/notifications/unread-count`, set `unreadCount` state
    - Open `EventSource('/api/notifications/stream')` on mount; on `new_notification` event: increment `unreadCount` by 1
    - On SSE `error`: close source; start exponential back-off reconnect (initial 5s, doubles, max 60s, up to 10 attempts); start polling `GET /api/notifications/unread-count` every 30s as fallback
    - On successful reconnect: stop polling; re-fetch unread count to reconcile missed notifications
    - On unmount: close `EventSource` and clear polling interval
    - Render badge: count > 99 → "99+"; count === 0 → no badge element
    - Toggle `panelOpen` state on bell click; render `<NotificationPanel>` when open, passing `onRead` callback to decrement count and `latestNotification` for real-time prepend
    - _Requirements: 4.5, 4.6, 4.8, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [ ]* 13.2 Write unit tests for NotificationBell
    - Mock `fetch` and `EventSource` in jsdom; assert badge increments on `new_notification` SSE event
    - Assert polling starts after SSE error, stops on reconnect
    - Assert `99+` renders when unread count exceeds 99; assert no badge when count is 0
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 14. UI — NotificationPreferences component
  - [x] 14.1 Create `apps/vyntrize-crm/components/notifications/NotificationPreferences.tsx`
    - On mount: fetch `GET /api/notifications/preferences`; build `Record<NotificationEventType, Record<NotificationChannel, boolean>>` state, filling missing rows with defaults (IN_APP=true, EMAIL=false)
    - Render table: rows = each `NotificationEventType`, columns = IN_APP and EMAIL toggles; SMS column rendered but `disabled` with "Coming soon" tooltip
    - On toggle change: update local state optimistically; debounce 800ms; call `PUT /api/notifications/preferences` with full current state
    - On save error: revert the specific toggle to pre-change value; show toast error
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  - [ ]* 14.2 Write unit tests for NotificationPreferences
    - Assert SMS column renders as `disabled`
    - Assert optimistic toggle updates immediately; assert revert on API error
    - Assert `PUT` is debounced and called with the full preference map
    - _Requirements: 8.1, 8.5, 8.6, 8.7_

- [ ] 15. Checkpoint — UI component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Full Notifications Page
  - [ ] 16.1 Create `apps/vyntrize-crm/app/(crm)/notifications/NotificationsClient.tsx`
    - Implement `filter` state: `'all'` (default) | `'unread'` | `NotificationEventType`
    - Implement `page` state with 25-items-per-page pagination, rendered as `<button>` controls
    - Render `<NotificationPreferences>` inside existing `Drawer` component when "Notification Settings" button is clicked
    - "Dismiss all" flow: show confirmation modal with "This will remove all notifications from your feed. This cannot be undone." → on confirm call `PATCH /api/notifications/dismiss-all` → clear list and show empty state → on failure show inline error and preserve list
    - Render filter controls and `<NotificationItem>` list; show empty-state message for each filter when no results
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [ ] 16.2 Create `apps/vyntrize-crm/app/(crm)/notifications/page.tsx` (server component shell)
    - Server component: call `getSession()`, redirect to `/login` if not logged in
    - Fetch initial notifications (page 1, pageSize 25) server-side and pass as props to `<NotificationsClient>`
    - _Requirements: 7.1, 7.2_

- [ ] 17. Integration — replace NotificationCenter stub and wire AgentAction hook
  - [ ] 17.1 Update `apps/vyntrize-crm/app/(crm)/layout.tsx` to use `NotificationBell`
    - Replace `import { NotificationCenter } from '@/components/NotificationCenter'` with `import { NotificationBell } from '@/components/notifications/NotificationBell'`
    - Replace `<NotificationCenter />` with `<NotificationBell />` in the JSX
    - Delete `apps/vyntrize-crm/components/NotificationCenter.tsx` stub file
    - _Requirements: 5.1_
  - [ ] 17.2 Add `AGENT_ACTION_PENDING` notification hook to agent action creation
    - Locate `base-agent.ts` `recordAction` method (which calls `prisma.agentAction.create`)
    - After the `prisma.agentAction.create` call, add fire-and-forget hook: if `status === 'PENDING'` and `autonomyLevel === 'SUGGEST_APPROVE' || 'COPILOT'`, call `notificationService.createNotificationsForAdmins(...)` with `catch` for silent failure
    - _Requirements: 2.8_
  - [ ]* 17.3 Write integration test for AgentAction notification hook
    - Mock `notificationService.createNotificationsForAdmins`; create a PENDING/SUGGEST_APPROVE AgentAction; assert the mock was called
    - Assert the mock is NOT called for FULLY_AUTONOMOUS or EXECUTED actions
    - _Requirements: 2.8_

- [ ] 18. Final checkpoint — end-to-end integration verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests validate the 10 correctness invariants defined in the design document's "Correctness Properties" section
- Checkpoints at tasks 5, 9, 15, and 18 ensure incremental verification
- Task 2.4 and 2.5 are numbered under section 3 intentionally — they validate `isEnabled` behavior implemented in task 3.2
- The `AGENT_ACTION_PENDING` event is wired directly via `base-agent.ts`, not through the event bus listener, as per design §11
- The existing `instrumentation.ts` already calls `initializeAgentSystem()`; task 7.1 adds the notification registration alongside it without removing that call
- SMS column in `NotificationPreferences` must be rendered as `disabled` from day one (design §7.4) to match the forward-compatibility contract in design §12

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1"] },
    { "id": 4, "tasks": ["3.1", "2.2", "2.3"] },
    { "id": 5, "tasks": ["3.2"] },
    { "id": 6, "tasks": ["2.4", "2.5", "3.3", "4.1"] },
    { "id": 7, "tasks": ["3.4", "3.5", "3.6", "4.2", "3.7"] },
    { "id": 8, "tasks": ["3.8", "6.1", "7.1"] },
    { "id": 9, "tasks": ["6.2", "6.3", "8.1", "8.2", "8.3"] },
    { "id": 10, "tasks": ["8.4", "8.5", "8.6"] },
    { "id": 11, "tasks": ["8.7", "10.1"] },
    { "id": 12, "tasks": ["11.1"] },
    { "id": 13, "tasks": ["12.1", "13.1", "14.1"] },
    { "id": 14, "tasks": ["12.2", "13.2", "14.2"] },
    { "id": 15, "tasks": ["16.1", "16.2"] },
    { "id": 16, "tasks": ["17.1", "17.2"] },
    { "id": 17, "tasks": ["17.3"] }
  ]
}
```
