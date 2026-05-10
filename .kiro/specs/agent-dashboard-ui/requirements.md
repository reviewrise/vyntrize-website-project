# Requirements Document: Agent Dashboard UI

## Introduction

The Agent Dashboard UI is a comprehensive web interface for the Vyntrize CRM that enables users to monitor, manage, and interact with the AI Pipeline Agent System. The dashboard provides real-time visibility into agent actions, system health, performance metrics, and approval workflows. Users can view all agent activity in a centralized location, filter and search actions, approve or reject pending suggestions, view detailed reasoning for each action, and monitor system health status. The interface follows the existing CRM design system using Next.js 15, React 19, TypeScript, and Tailwind CSS, with responsive layouts that work across desktop and mobile devices.

## Glossary

- **Agent_Dashboard**: The main UI page displaying agent activity, metrics, and controls
- **Dashboard_Page**: Next.js page component at `/agents` route showing the complete dashboard interface
- **Action_List**: Table or list component displaying agent actions with filtering and pagination
- **Action_Detail_View**: Modal or drawer showing complete information about a single agent action
- **Health_Status_Widget**: Component displaying real-time system health for agents and AI providers
- **Metrics_Panel**: Component displaying performance statistics and charts for agent effectiveness
- **Filter_Controls**: UI controls for filtering actions by type, status, date range, and agent
- **Approval_Interface**: UI components for approving or rejecting pending agent actions
- **Action_Card**: Individual card component displaying summary of an agent action
- **Status_Badge**: Visual indicator showing action status (PENDING, APPROVED, REJECTED, EXECUTED, FAILED)
- **Agent_Type_Badge**: Visual indicator showing which agent created the action
- **Reasoning_Display**: Component showing the AI-generated reasoning for an action
- **Metadata_Viewer**: Component displaying structured metadata associated with an action
- **Auto_Refresh**: Feature that automatically updates dashboard data at configurable intervals
- **Manual_Trigger_Button**: UI control allowing users to manually trigger agent execution
- **Date_Range_Picker**: Component for selecting start and end dates for filtering
- **Pagination_Controls**: UI controls for navigating through pages of actions
- **Empty_State**: UI displayed when no actions match current filters
- **Loading_State**: UI displayed while data is being fetched from API
- **Error_State**: UI displayed when API requests fail
- **CRM_Design_System**: Existing Vyntrize CRM styling patterns using CSS variables and Tailwind
- **Iron_Session**: Authentication system used to verify user access to dashboard

## Requirements

### Requirement 1: Dashboard Page and Navigation

**User Story:** As a CRM user, I want to access the agent dashboard from a dedicated section in the sidebar navigation, so that I can monitor agent activity easily.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL be accessible at the `/agents` route in the CRM application
2. THE CRM sidebar navigation SHALL include a separate "AI AGENTS" section with its own menu group
3. THE "AI AGENTS" section SHALL include a "Dashboard" menu item that navigates to `/agents`
4. THE "AI AGENTS" section SHALL be visually separated from CRM and Website sections (similar to existing section separation)
5. THE "AI AGENTS" section SHALL include an icon (e.g., robot, sparkles, or brain icon) to distinguish it
6. WHEN a user is not authenticated, THE Dashboard_Page SHALL redirect to the login page
7. THE Dashboard_Page SHALL use the existing CRM layout with sidebar navigation
8. THE Dashboard_Page SHALL display a page title "AI Agent Dashboard" with descriptive subtitle
9. THE Dashboard_Page SHALL be responsive and adapt to mobile, tablet, and desktop screen sizes
10. THE Dashboard_Page SHALL use the CRM_Design_System CSS variables for consistent styling
11. THE "AI AGENTS" section SHALL support future sub-menu items (e.g., "Settings", "Logs", "Analytics")

### Requirement 2: System Health Status Display

**User Story:** As a CRM manager, I want to see the health status of the agent system at a glance, so that I know if agents are operating correctly.

#### Acceptance Criteria

1. THE Health_Status_Widget SHALL display overall system status as "Healthy", "Degraded", or "Unhealthy"
2. THE Health_Status_Widget SHALL fetch health data from GET `/api/agents/health` endpoint
3. THE Health_Status_Widget SHALL display agent registry initialization status
4. THE Health_Status_Widget SHALL display AI provider status including circuit breaker state
5. THE Health_Status_Widget SHALL display job queue metrics including waiting and active job counts
6. WHEN the system status is "Healthy", THE Health_Status_Widget SHALL display a green status indicator
7. WHEN the system status is "Degraded" or "Unhealthy", THE Health_Status_Widget SHALL display a red status indicator
8. THE Health_Status_Widget SHALL display the last update timestamp
9. THE Health_Status_Widget SHALL refresh health data every 30 seconds automatically
10. WHEN the health API request fails, THE Health_Status_Widget SHALL display an error message with retry button

### Requirement 3: Agent Actions List Display

**User Story:** As a CRM user, I want to see all agent actions in a table or list, so that I can review what agents have done.

#### Acceptance Criteria

1. THE Action_List SHALL fetch actions from GET `/api/agents/actions` endpoint with pagination
2. THE Action_List SHALL display actions in reverse chronological order (newest first)
3. THE Action_List SHALL display 20 actions per page by default
4. THE Action_List SHALL show agent type, action type, status, lead name, reasoning summary, and timestamp for each action
5. THE Action_List SHALL use Status_Badge components to visually indicate action status
6. THE Action_List SHALL use Agent_Type_Badge components to visually indicate which agent created the action
7. THE Action_List SHALL display lead contact name and company when available
8. THE Action_List SHALL truncate long reasoning text to 100 characters with "..." indicator
9. WHEN a user clicks an action row, THE Action_List SHALL open the Action_Detail_View
10. THE Action_List SHALL include Pagination_Controls at the bottom for navigating pages
11. WHEN no actions exist, THE Action_List SHALL display an Empty_State with helpful message
12. WHEN actions are loading, THE Action_List SHALL display a Loading_State with skeleton UI

### Requirement 4: Action Filtering and Search

**User Story:** As a CRM user, I want to filter actions by type, status, and date, so that I can find specific actions quickly.

#### Acceptance Criteria

1. THE Filter_Controls SHALL include a dropdown for filtering by agent type (all types, LEAD_SCORING, TASK_AUTOMATION, etc.)
2. THE Filter_Controls SHALL include a dropdown for filtering by action status (all statuses, PENDING, APPROVED, EXECUTED, etc.)
3. THE Filter_Controls SHALL include a Date_Range_Picker for filtering by creation date
4. THE Filter_Controls SHALL include a search input for filtering by lead name or contact name
5. WHEN a user changes any filter, THE Action_List SHALL update to show only matching actions
6. THE Filter_Controls SHALL display the count of active filters when filters are applied
7. THE Filter_Controls SHALL include a "Clear Filters" button that resets all filters to default
8. THE Dashboard_Page SHALL preserve filter state in URL query parameters for bookmarking
9. WHEN filters result in zero actions, THE Action_List SHALL display an Empty_State explaining no matches found
10. THE Filter_Controls SHALL apply filters immediately without requiring a submit button

### Requirement 5: Action Detail View

**User Story:** As a CRM user, I want to view complete details about an action, so that I can understand what the agent did and why.

#### Acceptance Criteria

1. THE Action_Detail_View SHALL open in a modal or side drawer when a user clicks an action
2. THE Action_Detail_View SHALL display the complete agent type, action type, and status
3. THE Action_Detail_View SHALL display the full reasoning text without truncation
4. THE Action_Detail_View SHALL display the lead name, contact name, and company with links to lead detail page
5. THE Action_Detail_View SHALL display creation timestamp, execution timestamp, and approval timestamp when available
6. THE Action_Detail_View SHALL display the approving user name and email when action is approved
7. THE Action_Detail_View SHALL use Metadata_Viewer to display structured metadata in readable format
8. WHEN metadata contains scoring factors, THE Metadata_Viewer SHALL display them as labeled values
9. THE Action_Detail_View SHALL include a close button to dismiss the view
10. THE Action_Detail_View SHALL be keyboard accessible with Escape key to close

### Requirement 6: Pending Action Approval Interface

**User Story:** As a CRM user, I want to approve or reject pending agent suggestions, so that I can control which actions are executed.

#### Acceptance Criteria

1. THE Approval_Interface SHALL display prominently for actions with status PENDING
2. THE Approval_Interface SHALL include an "Approve" button styled with primary color
3. THE Approval_Interface SHALL include a "Reject" button styled with danger color
4. WHEN a user clicks "Approve", THE Approval_Interface SHALL send POST request to `/api/agents/actions/:id/approve`
5. WHEN a user clicks "Reject", THE Approval_Interface SHALL send POST request to `/api/agents/actions/:id/reject`
6. WHEN approval succeeds, THE Approval_Interface SHALL update the action status to APPROVED in the UI
7. WHEN rejection succeeds, THE Approval_Interface SHALL update the action status to REJECTED in the UI
8. WHEN approval or rejection fails, THE Approval_Interface SHALL display an error message
9. THE Approval_Interface SHALL disable buttons and show loading state during API request
10. THE Approval_Interface SHALL display the current user as the approver after successful approval
11. WHEN an action is not PENDING, THE Approval_Interface SHALL not display approval buttons

### Requirement 7: Performance Metrics Display

**User Story:** As a CRM manager, I want to see agent performance metrics, so that I can evaluate agent effectiveness.

#### Acceptance Criteria

1. THE Metrics_Panel SHALL fetch metrics from GET `/api/agents/metrics` endpoint
2. THE Metrics_Panel SHALL display total action count for the selected time period
3. THE Metrics_Panel SHALL display approval rate as a percentage
4. THE Metrics_Panel SHALL display average execution time in milliseconds
5. THE Metrics_Panel SHALL display action counts grouped by status (PENDING, APPROVED, EXECUTED, FAILED)
6. THE Metrics_Panel SHALL display action counts grouped by action type (SCORE_UPDATE, TASK_CREATE, EMAIL_SEND, etc.)
7. THE Metrics_Panel SHALL include a time period selector (7 days, 30 days, 90 days)
8. WHEN a user changes the time period, THE Metrics_Panel SHALL refresh metrics for the new period
9. THE Metrics_Panel SHALL use visual charts or graphs to display metric trends
10. THE Metrics_Panel SHALL display metrics grouped by agent type when multiple agents are active

### Requirement 8: Auto-Refresh Functionality

**User Story:** As a CRM user, I want the dashboard to automatically refresh, so that I see the latest agent activity without manual refresh.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL automatically refresh action data every 60 seconds
2. THE Dashboard_Page SHALL automatically refresh health status every 30 seconds
3. THE Dashboard_Page SHALL display a visual indicator showing when the last refresh occurred
4. THE Dashboard_Page SHALL include a manual refresh button for immediate updates
5. WHEN a user clicks the manual refresh button, THE Dashboard_Page SHALL fetch fresh data immediately
6. THE Auto_Refresh SHALL pause when the browser tab is not visible to conserve resources
7. THE Auto_Refresh SHALL resume when the browser tab becomes visible again
8. THE Auto_Refresh SHALL not interrupt user interactions (typing in filters, viewing details)
9. THE Dashboard_Page SHALL display a loading indicator during refresh without blocking the UI
10. WHEN auto-refresh fails, THE Dashboard_Page SHALL display an error notification with retry option

### Requirement 9: Manual Agent Trigger

**User Story:** As a CRM user, I want to manually trigger agent execution for a specific lead, so that I can get immediate agent analysis.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL include a Manual_Trigger_Button in the header or toolbar
2. WHEN a user clicks the Manual_Trigger_Button, THE Dashboard_Page SHALL display a lead selection modal
3. THE lead selection modal SHALL include a search input for finding leads by name or company
4. THE lead selection modal SHALL display a list of matching leads with name, company, and stage
5. WHEN a user selects a lead, THE lead selection modal SHALL display agent type checkboxes
6. THE lead selection modal SHALL allow selection of one or more agent types to trigger
7. WHEN a user confirms trigger, THE Dashboard_Page SHALL send POST request to `/api/agents/trigger` endpoint
8. WHEN trigger succeeds, THE Dashboard_Page SHALL display a success message and refresh the action list
9. WHEN trigger fails, THE Dashboard_Page SHALL display an error message with details
10. THE Manual_Trigger_Button SHALL be disabled during trigger execution with loading state

### Requirement 10: Responsive Design and Mobile Support

**User Story:** As a CRM user on mobile, I want the dashboard to work well on my phone, so that I can monitor agents on the go.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL use responsive grid layouts that adapt to screen width
2. WHEN screen width is below 768px, THE Action_List SHALL display as cards instead of table rows
3. WHEN screen width is below 768px, THE Filter_Controls SHALL collapse into a filter drawer or accordion
4. THE Action_Detail_View SHALL use full-screen modal on mobile devices
5. THE Health_Status_Widget SHALL stack vertically on mobile devices
6. THE Metrics_Panel SHALL display metrics in a single column on mobile devices
7. THE Dashboard_Page SHALL use touch-friendly button sizes (minimum 44x44 pixels)
8. THE Dashboard_Page SHALL support swipe gestures for dismissing modals on mobile
9. THE Dashboard_Page SHALL maintain readability with appropriate font sizes on all screen sizes
10. THE Dashboard_Page SHALL test successfully on iOS Safari, Android Chrome, and desktop browsers

### Requirement 11: Visual Design and Styling

**User Story:** As a CRM user, I want the dashboard to match the existing CRM design, so that it feels like a cohesive part of the application.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL use CSS variables from CRM_Design_System for colors (--color-primary, --color-surface, --color-text, etc.)
2. THE Dashboard_Page SHALL use Tailwind CSS utility classes consistent with other CRM pages
3. THE Status_Badge SHALL use color coding: green for EXECUTED/APPROVED, yellow for PENDING, red for FAILED/REJECTED
4. THE Agent_Type_Badge SHALL use distinct colors for each agent type for quick visual identification
5. THE Dashboard_Page SHALL use rounded corners (rounded-2xl) for cards and panels matching CRM style
6. THE Dashboard_Page SHALL use consistent spacing (gap-6, p-6) matching other CRM pages
7. THE Dashboard_Page SHALL use Heroicons for all icons matching the CRM icon library
8. THE Dashboard_Page SHALL use box shadows (var(--shadow-md)) for elevated components
9. THE Dashboard_Page SHALL support light and dark themes using CSS variables
10. THE Dashboard_Page SHALL use smooth transitions for hover states and interactive elements

### Requirement 12: Loading and Error States

**User Story:** As a CRM user, I want clear feedback when data is loading or errors occur, so that I understand what's happening.

#### Acceptance Criteria

1. THE Action_List SHALL display a Loading_State with skeleton UI while fetching actions
2. THE Health_Status_Widget SHALL display a Loading_State while fetching health data
3. THE Metrics_Panel SHALL display a Loading_State while fetching metrics
4. WHEN an API request fails, THE Dashboard_Page SHALL display an Error_State with error message
5. THE Error_State SHALL include a "Retry" button that re-attempts the failed request
6. THE Error_State SHALL display user-friendly error messages instead of technical error codes
7. WHEN network is offline, THE Dashboard_Page SHALL display a specific offline error message
8. THE Loading_State SHALL use animated skeletons matching the layout of loaded content
9. THE Dashboard_Page SHALL display inline error messages for failed approval/rejection actions
10. THE Dashboard_Page SHALL use toast notifications for transient success/error messages

### Requirement 13: Accessibility Compliance

**User Story:** As a CRM user with accessibility needs, I want the dashboard to be fully accessible, so that I can use it with assistive technologies.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL use semantic HTML elements (header, main, nav, table, button)
2. THE Dashboard_Page SHALL include ARIA labels for all interactive elements
3. THE Dashboard_Page SHALL support full keyboard navigation with visible focus indicators
4. THE Action_List SHALL be navigable with Tab, Enter, and Arrow keys
5. THE Filter_Controls SHALL be operable with keyboard only
6. THE Action_Detail_View SHALL trap focus within the modal when open
7. THE Status_Badge SHALL include aria-label describing the status for screen readers
8. THE Dashboard_Page SHALL maintain color contrast ratio of at least 4.5:1 for text
9. THE Dashboard_Page SHALL not rely solely on color to convey information (use icons and text)
10. THE Dashboard_Page SHALL announce dynamic content updates to screen readers using aria-live regions

### Requirement 14: Performance Optimization

**User Story:** As a CRM user, I want the dashboard to load quickly and respond smoothly, so that I can work efficiently.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL load initial view within 2 seconds on standard broadband connection
2. THE Dashboard_Page SHALL use React Server Components for initial page load when possible
3. THE Dashboard_Page SHALL implement pagination to limit data fetched per request to 20 items
4. THE Dashboard_Page SHALL use React.memo or useMemo for expensive computations
5. THE Dashboard_Page SHALL debounce search input to avoid excessive API calls (300ms delay)
6. THE Dashboard_Page SHALL cache API responses in React Query or SWR for 60 seconds
7. THE Dashboard_Page SHALL lazy load the Action_Detail_View component to reduce initial bundle size
8. THE Dashboard_Page SHALL use optimistic UI updates for approval/rejection actions
9. THE Dashboard_Page SHALL prefetch next page of actions when user scrolls near bottom
10. THE Dashboard_Page SHALL minimize re-renders by using proper React key props and dependency arrays

### Requirement 15: Data Formatting and Display

**User Story:** As a CRM user, I want data displayed in readable formats, so that I can understand information quickly.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL format timestamps as relative time (e.g., "2 hours ago", "3 days ago")
2. THE Dashboard_Page SHALL display full timestamps on hover using title attribute
3. THE Dashboard_Page SHALL format agent types as readable labels (e.g., "Lead Scoring" instead of "LEAD_SCORING")
4. THE Dashboard_Page SHALL format action types as readable labels (e.g., "Score Update" instead of "SCORE_UPDATE")
5. THE Metadata_Viewer SHALL format JSON metadata with proper indentation and syntax highlighting
6. THE Metadata_Viewer SHALL display numeric values with appropriate precision (2 decimal places for percentages)
7. THE Dashboard_Page SHALL display empty or null values as "—" instead of blank space
8. THE Dashboard_Page SHALL truncate long text with ellipsis and show full text on hover or in detail view
9. THE Dashboard_Page SHALL format large numbers with thousand separators (e.g., "1,234")
10. THE Dashboard_Page SHALL display boolean values as "Yes"/"No" instead of "true"/"false"

### Requirement 16: Integration with Existing CRM Features

**User Story:** As a CRM user, I want the dashboard to integrate with existing CRM features, so that I can navigate seamlessly.

#### Acceptance Criteria

1. THE Action_List SHALL include clickable links to lead detail pages for each action
2. WHEN a user clicks a lead link, THE Dashboard_Page SHALL navigate to `/leads/:id` route
3. THE Action_Detail_View SHALL display contact information with link to contact detail page
4. THE Dashboard_Page SHALL use Iron_Session for authentication consistent with other CRM pages
5. THE Dashboard_Page SHALL respect user role permissions (only ADMIN can configure agents)
6. THE Dashboard_Page SHALL use the same API error handling patterns as other CRM pages
7. THE Dashboard_Page SHALL use the same toast notification system as other CRM pages
8. THE Dashboard_Page SHALL maintain consistent navigation behavior with browser back button
9. THE Dashboard_Page SHALL integrate with CRM analytics tracking for usage monitoring
10. THE Dashboard_Page SHALL use the same date/time formatting utilities as other CRM pages

### Requirement 17: Empty States and Onboarding

**User Story:** As a new CRM user, I want helpful guidance when the dashboard is empty, so that I understand how to use agents.

#### Acceptance Criteria

1. WHEN no actions exist in the system, THE Dashboard_Page SHALL display an Empty_State with welcome message
2. THE Empty_State SHALL explain what AI agents do and how they help
3. THE Empty_State SHALL include a link to documentation or help center
4. THE Empty_State SHALL suggest triggering an agent manually to see how it works
5. WHEN filters result in no matches, THE Empty_State SHALL explain that filters may be too restrictive
6. THE Empty_State SHALL include a "Clear Filters" button when filters are active
7. THE Empty_State SHALL use friendly, encouraging language instead of technical jargon
8. THE Empty_State SHALL include relevant icons or illustrations to make it visually appealing
9. WHEN the agent system is not initialized, THE Dashboard_Page SHALL display a setup required message
10. THE Dashboard_Page SHALL display tooltips on first visit explaining key features (dismissible)

### Requirement 18: Batch Actions and Bulk Operations

**User Story:** As a CRM manager, I want to approve or reject multiple pending actions at once, so that I can process suggestions efficiently.

#### Acceptance Criteria

1. THE Action_List SHALL include checkboxes for selecting multiple actions when in PENDING status
2. THE Action_List SHALL include a "Select All" checkbox in the table header
3. WHEN one or more actions are selected, THE Action_List SHALL display a bulk action toolbar
4. THE bulk action toolbar SHALL include "Approve Selected" and "Reject Selected" buttons
5. WHEN a user clicks "Approve Selected", THE Dashboard_Page SHALL send approval requests for all selected actions
6. WHEN a user clicks "Reject Selected", THE Dashboard_Page SHALL send rejection requests for all selected actions
7. THE Dashboard_Page SHALL display progress indicator showing X of Y actions processed during bulk operation
8. WHEN bulk operation completes, THE Dashboard_Page SHALL display summary of successes and failures
9. THE Dashboard_Page SHALL refresh the action list after bulk operation completes
10. THE Action_List SHALL clear selection after bulk operation completes

### Requirement 19: Export and Reporting

**User Story:** As a CRM manager, I want to export agent action data, so that I can analyze it in external tools.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL include an "Export" button in the toolbar
2. WHEN a user clicks "Export", THE Dashboard_Page SHALL display export format options (CSV, JSON)
3. THE Dashboard_Page SHALL export actions matching current filters and date range
4. THE exported CSV SHALL include columns for agent type, action type, status, lead name, reasoning, and timestamps
5. THE exported JSON SHALL include complete action data including metadata
6. THE Dashboard_Page SHALL generate export file client-side without server request for small datasets (<1000 actions)
7. WHEN export dataset is large (>1000 actions), THE Dashboard_Page SHALL request server-side export via API
8. THE Dashboard_Page SHALL display download progress for large exports
9. THE exported filename SHALL include date range and timestamp (e.g., "agent-actions-2024-01-01-to-2024-01-31.csv")
10. THE Dashboard_Page SHALL display success message with download link after export completes

### Requirement 20: Agent Configuration Access

**User Story:** As a CRM admin, I want to access agent configuration from the dashboard, so that I can adjust agent behavior.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL include a "Settings" or "Configure" button visible only to ADMIN role users
2. WHEN an admin clicks "Configure", THE Dashboard_Page SHALL navigate to agent configuration page
3. THE Dashboard_Page SHALL display a warning badge when agents are disabled via feature flags
4. THE Dashboard_Page SHALL display agent autonomy levels in the Metrics_Panel
5. THE Dashboard_Page SHALL allow admins to enable or disable auto-refresh globally
6. THE Dashboard_Page SHALL display current agent configuration version or last updated timestamp
7. THE Dashboard_Page SHALL include a link to agent system documentation
8. THE Dashboard_Page SHALL display a notification when agent configuration has been updated by another user
9. THE Dashboard_Page SHALL prevent non-admin users from accessing configuration features
10. THE Dashboard_Page SHALL log all configuration changes in the audit trail
