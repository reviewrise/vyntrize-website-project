# Requirements Document

## Introduction

The Notification Center is an in-app feature for the Vyntrize CRM that gives users a real-time, persistent feed of alerts, activity updates, and system events. It surfaces actionable information — such as pipeline stage changes, new leads, AI agent actions, automation events, campaign updates, and calendar reminders — directly in the CRM navigation without requiring users to leave their current page.

The Notification Center integrates with the existing event bus (`lib/agents/event-bus.ts`) as its primary event source. It is designed to support multiple delivery channels: in-app (this spec) and email (via the existing email service). SMS is explicitly planned as a future channel and the data model and preference system must accommodate it without structural changes.

---

## Glossary

- **Notification_Center**: The in-app UI component — a bell icon with a dropdown panel — mounted in the CRM navigation bar that displays notifications for the authenticated user.
- **Notification**: A single alert record stored in the database, associated with a specific user, describing a CRM event along with its read/dismissed state.
- **Notification_Service**: The server-side service responsible for creating, persisting, delivering, and managing notification records.
- **Notification_Preferences**: Per-user settings that control which event types generate notifications and through which channels (in-app, email, SMS in future) they are delivered.
- **Delivery_Channel**: A transport mechanism for delivering a notification. Supported channels: `IN_APP`, `EMAIL`. Planned channel: `SMS`.
- **Event_Bus**: The existing singleton `AgentEventBus` in `lib/agents/event-bus.ts` that emits typed `CRMEvent` values.
- **Notification_Event_Type**: A categorized classification of what triggered a notification (e.g., `LEAD_CREATED`, `STAGE_CHANGED`, `AGENT_ACTION`, `CAMPAIGN_SENT`, `TASK_DUE`).
- **Unread_Count**: The number of notifications for a user that have not yet been marked as read.
- **Bell_Icon**: The nav-bar UI element that shows the Unread_Count badge and opens the Notification_Center panel on click.
- **CRM_User**: A record in the `crm_users` table representing an authenticated CRM operator.
- **SSE**: Server-Sent Events — a unidirectional HTTP streaming mechanism used to push real-time notification updates to the browser.
- **Polling_Fallback**: A client-side strategy of periodically calling the notifications API when an SSE connection is unavailable.

---

## Requirements

### Requirement 1: Notification Data Model

**User Story:** As a CRM developer, I want a well-structured, extensible notification schema, so that notification records can support multiple channels and event types without future schema rewrites.

#### Acceptance Criteria

1. THE Notification_Service SHALL store each notification as a record containing: a unique identifier, the target `userId`, a `Notification_Event_Type`, a human-readable `title` (maximum 255 characters), an optional `body` (maximum 2000 characters), an optional `entityType` and `entityId` (linking to the related CRM entity), a `channel` field (supporting `IN_APP` and `EMAIL`, extensible to `SMS`), a boolean `isRead` flag (default `false`), a boolean `isDismissed` flag (default `false`, independently settable from `isRead`), a `createdAt` timestamp, and a `readAt` timestamp (null when `isRead` is `false`, set to the current timestamp when `isRead` becomes `true`).
2. THE Notification_Service SHALL store notification preferences per user as a record containing: the `userId`, a `Notification_Event_Type`, a `channel`, and a boolean `isEnabled` flag — forming a unique composite key of `(userId, eventType, channel)`.
3. WHEN a new `Delivery_Channel` value (e.g., `SMS`) is introduced, THE Notification_Service SHALL support it by inserting new preference rows for that channel value, leaving all existing notification and preference records unmodified.
4. THE Notification_Service SHALL index notifications by `userId`, `isRead`, `isDismissed`, and `createdAt` such that a per-user feed query over 100,000 notification records returns results within 200ms.

---

### Requirement 2: Event Bus Integration

**User Story:** As a CRM operator, I want notifications to be generated automatically when important CRM events occur, so that I am alerted without manual intervention.

#### Acceptance Criteria

1. WHEN the Event_Bus emits a `LEAD_CREATED` event and the lead has an assigned user, THE Notification_Service SHALL create an `IN_APP` notification for the lead's assigned user AND for all users with `ADMIN` role.
2. WHEN the Event_Bus emits a `LEAD_CREATED` event and the lead has no assigned user, THE Notification_Service SHALL create an `IN_APP` notification for all users with `ADMIN` role only.
3. WHEN the Event_Bus emits a `STAGE_CHANGED` event and the lead has an assigned user, THE Notification_Service SHALL create an `IN_APP` notification for the lead's assigned user containing the previous stage name and the new stage name.
4. IF the Event_Bus emits a `STAGE_CHANGED` event and the lead has no assigned user, THEN THE Notification_Service SHALL log a warning and SHALL NOT create a notification record.
5. WHEN the Event_Bus emits a `TASK_CREATED` event, THE Notification_Service SHALL create an `IN_APP` notification for the user assigned to the task.
6. WHEN the Event_Bus emits a `TASK_COMPLETED` event, THE Notification_Service SHALL create an `IN_APP` notification for the task's creator.
7. WHEN the Event_Bus emits a `CALENDAR_EVENT_CREATED` or `CALENDAR_EVENT_UPDATED` event, THE Notification_Service SHALL create an `IN_APP` notification for the user in whose context the calendar event was created or to whom it is explicitly assigned.
8. WHEN an `AgentAction` record with status `PENDING` is created and the `autonomyLevel` is `SUGGEST_APPROVE` or `COPILOT`, THE Notification_Service SHALL create an `IN_APP` notification for all users with `ADMIN` role indicating an agent action requires review.
9. IF the target `userId` for a notification cannot be determined from the event payload, THEN THE Notification_Service SHALL log a warning and SHALL NOT create a notification record.
10. IF a user has no preference record for a given `Notification_Event_Type` and `IN_APP` channel, THEN THE Notification_Service SHALL treat the preference as enabled and SHALL create the notification.

---

### Requirement 3: Notification API

**User Story:** As a CRM frontend developer, I want a REST API for the Notification_Center, so that the UI can fetch, paginate, and update notification state reliably.

#### Acceptance Criteria

1. THE Notification_Service SHALL expose a `GET /api/notifications` endpoint that returns a paginated list of non-dismissed notifications for the authenticated user, ordered by `createdAt` descending, accepting `page` (default 1) and `pageSize` (default 20, maximum 50) query parameters, and SHALL include `totalCount` and `totalPages` in the response envelope.
2. THE Notification_Service SHALL expose a `GET /api/notifications/unread-count` endpoint that returns the integer count of non-dismissed, unread notifications for the authenticated user.
3. THE Notification_Service SHALL expose a `PATCH /api/notifications/:id/read` endpoint that marks a single notification as read by setting `isRead = true` and `readAt = now()` for the authenticated user; IF the `:id` does not exist or does not belong to the authenticated user, THE service SHALL return HTTP 404.
4. THE Notification_Service SHALL expose a `PATCH /api/notifications/read-all` endpoint that marks all unread, non-dismissed notifications as read for the authenticated user.
5. THE Notification_Service SHALL expose a `PATCH /api/notifications/:id/dismiss` endpoint that marks a single notification as dismissed by setting `isDismissed = true` for the authenticated user; IF the `:id` does not exist or does not belong to the authenticated user, THE service SHALL return HTTP 404.
6. THE Notification_Service SHALL expose a `GET /api/notifications/preferences` endpoint that returns all Notification_Preferences for the authenticated user.
7. THE Notification_Service SHALL expose a `PUT /api/notifications/preferences` endpoint that accepts an array (maximum 100 objects) of preference objects `{ eventType, channel, isEnabled }` and upserts them for the authenticated user; IF any object contains an unrecognized `eventType` or `channel` value, THE service SHALL return HTTP 400.
8. IF an unauthenticated request is made to any `/api/notifications` endpoint, THEN THE Notification_Service SHALL return HTTP 401.
9. IF a request attempts to read or modify a notification belonging to a different user, THEN THE Notification_Service SHALL return HTTP 403.

---

### Requirement 4: Real-Time Delivery

**User Story:** As a CRM operator, I want to receive in-app notifications in real time without refreshing the page, so that I can react to pipeline events as they happen.

#### Acceptance Criteria

1. THE Notification_Service SHALL expose a `GET /api/notifications/stream` SSE endpoint that keeps a connection open and pushes a `new_notification` event containing the serialized notification payload whenever a new notification is created for the authenticated user.
2. WHEN a new notification is created for a user who has an active SSE connection, THE Notification_Service SHALL push the notification to that connection within 2 seconds of the database write.
3. WHEN an SSE connection is closed by the client, THE Notification_Service SHALL cease pushing any further events on that connection.
4. WHILE an SSE connection is active, THE Notification_Service SHALL send a `ping` event every 30 seconds to keep the connection alive.
5. IF the client cannot establish an SSE connection, THEN THE Notification_Center UI SHALL fall back to polling `GET /api/notifications/unread-count` every 30 seconds.
6. WHEN a `ping` event is not received within 60 seconds, THE Notification_Center UI SHALL close the current SSE connection and attempt to reconnect with exponential back-off starting at 5 seconds, not exceeding 60 seconds, up to a maximum of 10 reconnection attempts.
7. IF an unauthenticated request is made to `GET /api/notifications/stream`, THEN THE Notification_Service SHALL return HTTP 401 and SHALL NOT open a stream.
8. WHEN a reconnection attempt succeeds while the polling fallback is active, THE Notification_Center UI SHALL stop polling and resume SSE delivery.

---

### Requirement 5: Notification Center UI — Bell Icon

**User Story:** As a CRM operator, I want a bell icon in the navigation bar that shows how many unread notifications I have, so that I can quickly see whether there is anything requiring my attention.

#### Acceptance Criteria

1. THE Notification_Center SHALL render a bell icon in the CRM top navigation bar that is visible on all authenticated CRM pages (excludes login and auth routes).
2. WHEN the authenticated user has one or more unread, non-dismissed notifications, THE Notification_Center SHALL display a numeric badge on the Bell_Icon showing the count of notifications where `isRead = false` AND `isDismissed = false`.
3. WHEN the unread, non-dismissed count exceeds 99, THE Notification_Center SHALL display "99+" in the badge.
4. WHEN the unread, non-dismissed count is zero, THE Notification_Center SHALL not render a badge on the Bell_Icon.
5. WHEN a new notification is received via SSE, THE Notification_Center SHALL increment the badge count by 1 without a full page reload.
6. WHEN the Notification_Center first mounts, THE Notification_Center SHALL fetch the initial unread count from `GET /api/notifications/unread-count` before rendering the badge.
7. WHEN an SSE reconnection succeeds after a prior disconnect, THE Notification_Center SHALL re-fetch `GET /api/notifications/unread-count` to reconcile any notifications received during the disconnection.

---

### Requirement 6: Notification Center UI — Dropdown Panel

**User Story:** As a CRM operator, I want to open a notification panel from the bell icon and view my recent notifications, so that I can review and act on CRM events without navigating away.

#### Acceptance Criteria

1. WHEN the user clicks the Bell_Icon, THE Notification_Center SHALL open a dropdown panel displaying the 20 most recent non-dismissed notifications fetched from `GET /api/notifications?pageSize=20`.
2. THE Notification_Center SHALL display each notification with: an icon representing the `Notification_Event_Type`, the notification `title`, a relative timestamp (e.g., "3 minutes ago"), and a visually distinct style for unread notifications compared to read ones.
3. WHEN the user clicks on a notification that contains an `entityType` and `entityId`, THE Notification_Center SHALL call `PATCH /api/notifications/:id/read`, then navigate the user to the relevant CRM entity page.
4. WHEN the user clicks on a notification that has no `entityType` or `entityId`, THE Notification_Center SHALL call `PATCH /api/notifications/:id/read` and update that notification's visual state to read in-place without navigation.
5. WHEN the user clicks "Mark all as read", THE Notification_Center SHALL call `PATCH /api/notifications/read-all` and update all displayed notifications to the read visual state without a full page reload.
6. WHEN the user clicks the dismiss (×) button on a notification, THE Notification_Center SHALL call `PATCH /api/notifications/:id/dismiss` and remove that notification from the panel without a full page reload.
7. WHEN the dropdown panel is open and a new notification arrives via SSE, THE Notification_Center SHALL prepend the new notification to the top of the list.
8. WHEN the panel contains 20 notifications, THE Notification_Center SHALL display a "View all notifications" link that navigates to the full notifications page at `/notifications`.
9. WHEN the panel is open and the user clicks outside of it, THE Notification_Center SHALL close the panel.
10. WHEN the panel opens and there are no non-dismissed notifications, THE Notification_Center SHALL display an empty-state message (e.g., "You're all caught up").

---

### Requirement 7: Full Notifications Page

**User Story:** As a CRM operator, I want a dedicated notifications page where I can view and manage my complete notification history, so that I can review past events without being limited to the 20-item dropdown.

#### Acceptance Criteria

1. THE Notification_Center SHALL provide a full notifications page at the route `/notifications` within the CRM app.
2. WHEN the user navigates to `/notifications`, THE Notification_Center SHALL display all non-dismissed notifications in descending chronological order with pagination of 25 items per page.
3. WHEN a filter of "Unread only" is applied, THE Notification_Center SHALL display only notifications where `isRead = false`; IF no unread notifications exist, THE Notification_Center SHALL display an empty-state message.
4. WHEN a filter by `Notification_Event_Type` is applied, THE Notification_Center SHALL display only notifications of the selected type; IF no notifications match the selected type, THE Notification_Center SHALL display an empty-state message.
5. WHEN the user clicks "Dismiss all", THE Notification_Center SHALL display a confirmation prompt before proceeding.
6. WHEN the user confirms "Dismiss all", THE Notification_Center SHALL call `PATCH /api/notifications/dismiss-all`, clear the notification list, and display a success message.
7. IF the "Dismiss all" operation fails, THEN THE Notification_Center SHALL display an error message and leave the existing notifications in their current state.

---

### Requirement 8: Notification Preferences

**User Story:** As a CRM operator, I want to configure which events generate in-app notifications, so that I only receive alerts that are relevant to my role and workflow.

#### Acceptance Criteria

1. WHEN the user opens the preferences settings UI (accessible from both the notifications dropdown and the full notifications page), THE Notification_Center SHALL display each `Notification_Event_Type` with toggle controls per `Delivery_Channel`, pre-populated with the user's current saved preference state.
2. WHEN a user disables a `Notification_Event_Type` for the `IN_APP` channel and saves, THE Notification_Service SHALL not create new `IN_APP` notification records for that event type for that user.
3. WHEN a user disables a `Notification_Event_Type` for the `EMAIL` channel and saves, THE Notification_Service SHALL not send notification emails for that event type for that user.
4. IF no preference record exists for a given user and `Notification_Event_Type` and channel combination, THEN THE Notification_Service SHALL treat the preference as `IN_APP` enabled and `EMAIL` disabled by default.
5. WHEN a user saves a preference change, THE Notification_Service SHALL persist and enforce the new preference within 5 seconds of the save action.
6. IF the preference save operation fails, THEN THE Notification_Center SHALL revert the toggle to its previous state and display an error message to the user.
7. WHEN the `SMS` channel is enabled in a future release, THE Notification_Center SHALL render an SMS toggle for each `Notification_Event_Type` in the same per-event-type row as the `IN_APP` and `EMAIL` toggles.

---

### Requirement 9: Email Notification Channel

**User Story:** As a CRM operator, I want to optionally receive email notifications for important CRM events, so that I am informed even when I am not actively using the CRM.

#### Acceptance Criteria

1. WHEN a notification is created, the target user has `EMAIL` enabled for that `Notification_Event_Type`, and the user has a valid email address on their profile, THE Notification_Service SHALL send an email notification using the existing `emailService.sendEmail()` function.
2. THE Notification_Service SHALL send email notifications using the `admin` role email configuration.
3. WHEN an email notification is sent, THE Notification_Service SHALL set the email subject to the notification `title` and the body to the notification `body`.
4. IF the notification contains an `entityType` and `entityId`, THEN THE Notification_Service SHALL include a direct link to the relevant CRM entity in the email body.
5. IF `emailService.sendEmail()` returns `success: false`, THEN THE Notification_Service SHALL log the error, leave the in-app notification record unmodified, and SHALL NOT retry the email delivery automatically.
6. IF the target user has `EMAIL` enabled but has no email address on their profile, THEN THE Notification_Service SHALL log a warning and skip email delivery without affecting the in-app notification record.
7. WHEN a notification is created from an event that is explicitly flagged as a seed or test operation at the point of creation, THE Notification_Service SHALL not send an email notification for that event.

---

### Requirement 10: Notification Retention and Cleanup

**User Story:** As a CRM administrator, I want old notifications to be automatically cleaned up, so that the notifications table does not grow unbounded and degrade query performance.

#### Acceptance Criteria

1. WHEN the cleanup operation is invoked, THE Notification_Service SHALL permanently delete all notifications where `isDismissed = true` and `createdAt` is older than 30 days.
2. WHEN the cleanup operation is invoked, THE Notification_Service SHALL permanently delete all notifications where `isRead = true` and `createdAt` is older than 90 days.
3. WHEN the cleanup operation is invoked, THE Notification_Service SHALL permanently delete all notifications where `createdAt` is older than 180 days, regardless of `isRead` or `isDismissed` state.
4. WHEN a cleanup operation completes successfully, THE Notification_Service SHALL log an entry recording which retention rule was applied and the count of deleted records; a count of zero is a valid outcome and SHALL be logged.
5. IF the cleanup operation fails to complete, THEN THE Notification_Service SHALL log an error entry indicating which retention rule was being processed at the time of failure, and SHALL leave any unprocessed notifications unmodified.
