# Tasks: Agent Dashboard UI

## Task 1: Setup and Foundation

### Task 1.1: Create TypeScript Types
- [ ] Create `apps/vyntrize-crm/types/agent-dashboard.ts`
- [ ] Define `AgentAction` interface
- [ ] Define `PaginationInfo` interface
- [ ] Define `ActionsResponse` interface
- [ ] Define `HealthStatus` interface
- [ ] Define `MetricsResponse` and `MetricsSummary` interfaces
- [ ] Define `FilterState` interface
- [ ] Define `TriggerRequest` and `TriggerResponse` interfaces
- [ ] Export all types

### Task 1.2: Update Sidebar Navigation
- [ ] Open `apps/vyntrize-crm/components/Sidebar.tsx`
- [ ] Import `Sparkles` icon from `lucide-react`
- [ ] Create `AI_AGENTS_NAV` constant array with Dashboard item
- [ ] Add "AI AGENTS" section between "Website" and "Settings" sections
- [ ] Render AI Agents navigation items using `NavItem` component
- [ ] Test navigation highlighting on `/agents` route

## Task 2: API Endpoints

### Task 2.1: Create Approve Action Endpoint
- [ ] Create directory `apps/vyntrize-crm/app/api/agents/actions/[actionId]/approve/`
- [ ] Create `route.ts` file
- [ ] Implement POST handler with iron-session authentication
- [ ] Update AgentAction status to 'APPROVED'
- [ ] Set `approvedByUserId` and `approvedAt` fields
- [ ] Return success response with updated action
- [ ] Add error handling

### Task 2.2: Create Reject Action Endpoint
- [ ] Create directory `apps/vyntrize-crm/app/api/agents/actions/[actionId]/reject/`
- [ ] Create `route.ts` file
- [ ] Implement POST handler with iron-session authentication
- [ ] Update AgentAction status to 'REJECTED'
- [ ] Set `approvedByUserId` and `approvedAt` fields
- [ ] Return success response with updated action
- [ ] Add error handling

### Task 2.3: Enhance Actions List Endpoint
- [ ] Open `apps/vyntrize-crm/app/api/agents/actions/route.ts`
- [ ] Add search parameter support for lead name/company filtering
- [ ] Update Prisma query to include search in where clause
- [ ] Test search functionality with various queries

## Task 3: Core Dashboard Components

### Task 3.1: Create Dashboard Page (Server Component)
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/page.tsx`
- [ ] Import `getSession` from `@/lib/session`
- [ ] Add authentication check and redirect logic
- [ ] Set page metadata (title, description)
- [ ] Render `AgentsDashboardClient` component
- [ ] Test authentication flow

### Task 3.2: Create AgentsDashboardClient Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/AgentsDashboardClient.tsx`
- [ ] Set up state management (actions, health, metrics, modals)
- [ ] Implement URL search params integration
- [ ] Create `fetchData` function with parallel API calls
- [ ] Implement auto-refresh logic (60s for actions, 30s for health)
- [ ] Create `updateFilters` function for URL state management
- [ ] Implement approve/reject handlers
- [ ] Render all child components
- [ ] Add loading and error states

### Task 3.3: Create DashboardHeader Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/components/DashboardHeader.tsx`
- [ ] Add page title and subtitle
- [ ] Create Refresh button with icon
- [ ] Create Trigger Agent button with icon
- [ ] Apply CRM design system styling
- [ ] Add ARIA labels for accessibility

## Task 4: Health and Metrics Components

### Task 4.1: Create HealthStatusWidget Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/components/HealthStatusWidget.tsx`
- [ ] Implement status badge with color-coded icons
- [ ] Display Agent Registry status
- [ ] Display Job Queue metrics
- [ ] Display AI Providers status
- [ ] Add last updated timestamp
- [ ] Create loading skeleton component
- [ ] Create error state component
- [ ] Apply responsive grid layout

### Task 4.2: Create MetricsPanel Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/components/MetricsPanel.tsx`
- [ ] Create `MetricCard` sub-component
- [ ] Implement time period selector (7, 30, 90 days)
- [ ] Display 4 primary metric cards
- [ ] Create `ActionsByStatus` sub-component
- [ ] Create `ActionsByType` sub-component
- [ ] Implement `formatActionType` helper function
- [ ] Create loading skeleton component
- [ ] Apply responsive grid layout

## Task 5: Filter and Badge Components

### Task 5.1: Create FilterControls Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/components/FilterControls.tsx`
- [ ] Implement Agent Type dropdown filter
- [ ] Implement Status dropdown filter
- [ ] Implement Search input with debouncing (300ms)
- [ ] Add active filter count badge
- [ ] Create Clear Filters button
- [ ] Implement `formatAgentType` helper function
- [ ] Apply responsive grid layout
- [ ] Test filter state synchronization with URL

### Task 5.2: Create StatusBadge Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/components/StatusBadge.tsx`
- [ ] Define status configuration object (colors, icons, labels)
- [ ] Implement badge rendering with icon
- [ ] Add ARIA label for accessibility
- [ ] Apply color-coded styling (green/yellow/red)

### Task 5.3: Create AgentTypeBadge Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/components/AgentTypeBadge.tsx`
- [ ] Define agent type configuration object (colors, icons, labels)
- [ ] Implement badge rendering with icon
- [ ] Apply distinct colors for each agent type
- [ ] Handle unknown agent types gracefully

## Task 6: Action List Component

### Task 6.1: Create ActionList Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/components/ActionList.tsx`
- [ ] Implement desktop table view with columns
- [ ] Implement mobile card view
- [ ] Add row click handler to open detail modal
- [ ] Create pagination controls
- [ ] Implement `formatRelativeTime` helper function
- [ ] Implement `truncateText` helper function
- [ ] Create loading skeleton component
- [ ] Create error state component with retry button
- [ ] Create empty state component
- [ ] Add hover effects for table rows
- [ ] Test responsive breakpoints

## Task 7: Modal Components

### Task 7.1: Create ActionDetailModal Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/components/ActionDetailModal.tsx`
- [ ] Implement modal overlay and container
- [ ] Add modal header with close button
- [ ] Display agent type and status badges
- [ ] Display lead information with link
- [ ] Display full reasoning text
- [ ] Display metadata viewer with JSON formatting
- [ ] Display timestamps (created, executed, approved)
- [ ] Display approver information
- [ ] Implement approval interface for PENDING actions
- [ ] Add Escape key handler to close modal
- [ ] Implement focus trap for accessibility
- [ ] Add approve/reject button handlers with loading states
- [ ] Test keyboard navigation

### Task 7.2: Create ManualTriggerModal Component
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/components/ManualTriggerModal.tsx`
- [ ] Implement modal overlay and container
- [ ] Add modal header with close button
- [ ] Create lead search input with debouncing
- [ ] Implement lead search API integration
- [ ] Display lead search results list
- [ ] Add lead selection handler
- [ ] Display selected lead confirmation
- [ ] Create agent type checkboxes
- [ ] Implement multi-agent selection logic
- [ ] Create trigger button with loading state
- [ ] Implement trigger API calls (parallel for multiple agents)
- [ ] Add success/error handling
- [ ] Test two-step workflow

## Task 8: Styling and Responsiveness

### Task 8.1: Apply CRM Design System
- [ ] Verify all components use CSS variables
- [ ] Apply consistent Tailwind classes (rounded-2xl, gap-6, p-6)
- [ ] Ensure proper color usage (text, surface, border, primary)
- [ ] Add hover states with transitions
- [ ] Test light and dark theme support

### Task 8.2: Implement Responsive Design
- [ ] Test mobile layout (< 768px)
- [ ] Test tablet layout (768px - 1024px)
- [ ] Test desktop layout (> 1024px)
- [ ] Verify table-to-card transition on mobile
- [ ] Test filter controls collapse on mobile
- [ ] Verify modal full-screen on mobile
- [ ] Test touch-friendly button sizes (44x44px minimum)

## Task 9: Accessibility

### Task 9.1: Add ARIA Labels and Semantic HTML
- [ ] Add ARIA labels to all interactive elements
- [ ] Use semantic HTML (header, main, nav, table, button)
- [ ] Add aria-live regions for dynamic updates
- [ ] Add role attributes where needed
- [ ] Test with screen reader (NVDA/JAWS)

### Task 9.2: Implement Keyboard Navigation
- [ ] Test Tab navigation through all elements
- [ ] Verify visible focus indicators
- [ ] Test Enter key activation for buttons
- [ ] Test Escape key for modal closing
- [ ] Verify focus trap in modals
- [ ] Test logical tab order

### Task 9.3: Verify Color Contrast
- [ ] Check text color contrast ratios (minimum 4.5:1)
- [ ] Verify badge color contrast
- [ ] Ensure status indicators don't rely solely on color
- [ ] Test with color blindness simulator

## Task 10: Performance Optimization

### Task 10.1: Implement Code Splitting
- [ ] Lazy load ActionDetailModal component
- [ ] Lazy load ManualTriggerModal component
- [ ] Verify bundle size reduction

### Task 10.2: Add Memoization
- [ ] Wrap MetricCard in React.memo
- [ ] Wrap ActionCard in React.memo
- [ ] Use useMemo for filtered/computed data
- [ ] Use useCallback for stable function references
- [ ] Verify re-render reduction with React DevTools

### Task 10.3: Optimize Data Fetching
- [ ] Implement parallel API requests
- [ ] Add request caching (60 seconds)
- [ ] Verify auto-refresh intervals (30s/60s)
- [ ] Test pause on tab visibility change
- [ ] Measure and optimize initial load time (< 2 seconds)

## Task 11: Error Handling

### Task 11.1: Add Error Boundaries
- [ ] Create `apps/vyntrize-crm/app/(crm)/agents/error.tsx`
- [ ] Implement error boundary component
- [ ] Add reset functionality
- [ ] Test error boundary with simulated errors

### Task 11.2: Implement Error States
- [ ] Add network error handling with retry
- [ ] Add authentication error redirect
- [ ] Add validation error messages
- [ ] Add user-friendly API error messages
- [ ] Add offline state detection and message
- [ ] Test all error scenarios

## Task 12: Testing

### Task 12.1: Unit Tests
- [ ] Test StatusBadge component rendering
- [ ] Test AgentTypeBadge component rendering
- [ ] Test formatRelativeTime function
- [ ] Test formatActionType function
- [ ] Test truncateText function
- [ ] Test filter logic
- [ ] Achieve 80%+ code coverage

### Task 12.2: Integration Tests
- [ ] Test API endpoint responses
- [ ] Test authentication flow
- [ ] Test filter state management
- [ ] Test modal interactions
- [ ] Test approve/reject workflow

### Task 12.3: E2E Tests
- [ ] Test complete user flow (view actions)
- [ ] Test approve action workflow
- [ ] Test reject action workflow
- [ ] Test manual trigger workflow
- [ ] Test responsive design on different screen sizes
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

## Task 13: Documentation and Deployment

### Task 13.1: Add Documentation
- [ ] Add inline code comments
- [ ] Document component props with JSDoc
- [ ] Update README with dashboard usage
- [ ] Create user guide for dashboard features

### Task 13.2: Final Testing and QA
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on iOS Safari and Android Chrome
- [ ] Verify all acceptance criteria from requirements
- [ ] Perform accessibility audit
- [ ] Perform performance audit
- [ ] Fix any identified issues

### Task 13.3: Deployment Preparation
- [ ] Run production build
- [ ] Verify no build errors
- [ ] Test production build locally
- [ ] Verify environment variables
- [ ] Create deployment checklist
- [ ] Deploy to staging environment
- [ ] Perform smoke tests on staging
- [ ] Deploy to production

## Task 14: Post-Launch

### Task 14.1: Monitoring
- [ ] Set up error tracking
- [ ] Monitor page load times
- [ ] Monitor API response times
- [ ] Track user interactions
- [ ] Review user feedback

### Task 14.2: Iteration
- [ ] Address any bugs reported
- [ ] Gather user feedback
- [ ] Plan Phase 2 enhancements
- [ ] Update documentation based on feedback
