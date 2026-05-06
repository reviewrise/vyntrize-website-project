# Implementation Plan: AI Pipeline Agent System

## Overview

This implementation plan breaks down the AI Pipeline Agent System into three phases: Foundation (core infrastructure), Intelligence (AI-powered agents), and Advanced (predictive and automation features). Each phase builds incrementally on the previous, with checkpoints to ensure stability before proceeding.

The system uses TypeScript with Next.js API routes, Prisma ORM, BullMQ for job scheduling, and OpenAI GPT-4 for AI-powered features. All agents follow a common base class pattern with event-driven and scheduled execution models.

## Phase 1: Foundation

### 1. Database Schema and Infrastructure Setup

- [ ] 1.1 Create Prisma schema extensions for agent system
  - Add AgentAction, AgentRule, AgentMetric models to schema.prisma
  - Define AgentType, ActionType, ActionStatus, AutonomyLevel enums
  - Add indexes for leadId, agentType, status, createdAt
  - Add score, qualificationStatus, lastActivityAt fields to Lead model
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ]* 1.2 Write unit tests for schema validation
  - Test enum values are correctly defined
  - Test model relationships and cascades
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 1.3 Generate and run Prisma migration
  - Run `npx prisma migrate dev --name add-agent-system`
  - Verify migration creates all tables and indexes
  - Test rollback and re-apply migration
  - _Requirements: 2.1, 2.2, 2.3_

### 2. Agent Base Infrastructure

- [ ] 2.1 Implement Agent base class
  - Create `apps/vyntrize-crm/lib/agents/base-agent.ts`
  - Define AgentType, ActionType, ActionStatus, AutonomyLevel enums
  - Implement abstract Agent class with execute(), getConfig(), recordAction(), log() methods
  - Add feature flag checking via isEnabled()
  - _Requirements: 1.1, 1.6, 1.7, 18.1, 18.2, 18.3_

- [ ]* 2.2 Write unit tests for Agent base class
  - Test recordAction creates database records correctly
  - Test feature flag checking
  - Test logging functionality
  - _Requirements: 1.6, 1.7, 18.1_

- [ ] 2.3 Implement Event Bus
  - Create `apps/vyntrize-crm/lib/agents/event-bus.ts`
  - Implement AgentEventBus extending EventEmitter
  - Add registerAgent() and emitCRMEvent() methods
  - Define CRMEvent enum with all event types
  - _Requirements: 1.1, 1.2, 1.7_

- [ ]* 2.4 Write unit tests for Event Bus
  - Test agent registration
  - Test event emission to multiple agents
  - Test error handling when agent execution fails
  - _Requirements: 1.1, 1.2, 1.7_

### 3. Job Scheduler Setup

- [ ] 3.1 Install and configure BullMQ dependencies
  - Add bullmq and ioredis to package.json
  - Configure Redis connection in environment variables
  - _Requirements: 1.3, 1.4_

- [ ] 3.2 Implement Job Scheduler
  - Create `apps/vyntrize-crm/lib/agents/job-scheduler.ts`
  - Implement AgentJobScheduler with BullMQ queue and worker
  - Add scheduleJob(), scheduleRecurringJob(), getMetrics() methods
  - Configure retry logic with exponential backoff
  - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [ ]* 3.3 Write unit tests for Job Scheduler
  - Test job scheduling and execution
  - Test retry logic with exponential backoff
  - Test job prioritization
  - Mock Redis and BullMQ for testing
  - _Requirements: 1.3, 1.4, 1.5_

### 4. OpenAI Integration

- [ ] 4.1 Implement OpenAI Provider
  - Create `apps/vyntrize-crm/lib/agents/openai-provider.ts`
  - Implement OpenAIProvider class with rate limiting and caching
  - Add generateCompletion() method with retry logic
  - Implement circuit breaker pattern
  - Add input sanitization to prevent prompt injection
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

- [ ]* 4.2 Write unit tests for OpenAI Provider
  - Test rate limiting logic
  - Test caching mechanism
  - Test circuit breaker opens after failures
  - Test input sanitization
  - Mock OpenAI API responses
  - _Requirements: 6.3, 6.4, 6.5, 6.8, 6.10_

- [ ]* 4.3 Write integration tests for OpenAI Provider
  - Test actual API calls with test API key (if available)
  - Test error handling for API failures
  - Test token usage tracking
  - _Requirements: 6.1, 6.2, 6.6_

### 5. Error Handling and Utilities

- [ ] 5.1 Implement error classes
  - Create `apps/vyntrize-crm/lib/agents/errors.ts`
  - Define AgentError, OpenAIError, RateLimitError, CircuitBreakerError classes
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 5.2 Implement retry utility
  - Create `apps/vyntrize-crm/lib/agents/retry.ts`
  - Implement retryWithBackoff() function with configurable backoff
  - _Requirements: 1.5, 6.4_

- [ ] 5.3 Implement circuit breaker utility
  - Create `apps/vyntrize-crm/lib/agents/circuit-breaker.ts`
  - Implement CircuitBreaker class with CLOSED, OPEN, HALF_OPEN states
  - _Requirements: 15.7, 6.4_

- [ ]* 5.4 Write unit tests for error handling utilities
  - Test retry logic with different failure scenarios
  - Test circuit breaker state transitions
  - _Requirements: 1.5, 15.7_

### 6. Checkpoint - Foundation Complete

- [ ] 6.1 Verify all foundation components are working
  - Ensure all tests pass
  - Verify database schema is correctly applied
  - Test Event Bus can emit events
  - Test Job Scheduler can schedule and execute jobs
  - Test OpenAI Provider can make API calls (with mock or real API)
  - Ask the user if questions arise

## Phase 2: Core Agents

### 7. Lead Scoring Agent

- [ ] 7.1 Implement Lead Scoring Agent
  - Create `apps/vyntrize-crm/lib/agents/lead-scoring-agent.ts`
  - Implement LeadScoringAgent extending Agent base class
  - Add scoring calculation logic based on email opens, clicks, website visits, tasks, inactivity
  - Implement qualification status determination (qualified/warm/cold)
  - Add reasoning generation for explainability
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ]* 7.2 Write unit tests for Lead Scoring Agent
  - Test score calculation with various activity combinations
  - Test qualification status determination
  - Test inactivity penalty calculation
  - Test score clamping to 0-100 range
  - Mock Prisma database calls
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 7.3 Register Lead Scoring Agent with Event Bus and Job Scheduler
  - Register for lead_created, lead_updated, email_opened, email_clicked events
  - Schedule daily batch job for recalculating all lead scores
  - _Requirements: 3.10, 3.11_

### 8. Task Automation Agent

- [ ] 8.1 Implement Task Automation Agent
  - Create `apps/vyntrize-crm/lib/agents/task-automation-agent.ts`
  - Implement TaskAutomationAgent extending Agent base class
  - Define stage-to-task configuration mapping
  - Add business day calculation for due dates
  - Implement task creation with assignee determination
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ]* 8.2 Write unit tests for Task Automation Agent
  - Test task creation for each stage transition
  - Test business day calculation
  - Test assignee determination logic
  - Test duplicate task prevention
  - Mock Prisma database calls
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

- [ ] 8.3 Register Task Automation Agent with Event Bus
  - Register for stage_changed events
  - _Requirements: 4.10_

### 9. Stagnation Detection Agent

- [ ] 9.1 Implement Stagnation Detection Agent
  - Create `apps/vyntrize-crm/lib/agents/stagnation-detection-agent.ts`
  - Implement StagnationDetectionAgent extending Agent base class
  - Define stagnation thresholds for different stages
  - Implement checkLead() and scanAllLeads() methods
  - Add task creation and alert sending for stagnant leads
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8_

- [ ]* 9.2 Write unit tests for Stagnation Detection Agent
  - Test stagnation detection for different stages and thresholds
  - Test task creation for stagnant leads
  - Test alert generation for severely stagnant leads
  - Test skipping of closed leads (WON/LOST)
  - Mock Prisma database calls
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.8_

- [ ] 9.3 Register Stagnation Detection Agent with Job Scheduler
  - Schedule daily batch job to scan all active leads
  - _Requirements: 5.7_

### 10. Email Generation Agent

- [ ] 10.1 Implement Email Generation Agent
  - Create `apps/vyntrize-crm/lib/agents/email-generation-agent.ts`
  - Implement EmailGenerationAgent extending Agent base class
  - Build context from lead data, activities, and email tracking
  - Generate email subject and body using OpenAI Provider
  - Implement tone selection based on pipeline stage
  - Parse AI response to extract subject and body
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8_

- [ ]* 10.2 Write unit tests for Email Generation Agent
  - Test email generation with different lead stages
  - Test tone selection logic
  - Test email parsing from AI response
  - Mock OpenAI Provider responses
  - Mock Prisma database calls
  - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 10.3 Implement email approval and sending workflow
  - Email actions created with SUGGEST_APPROVE autonomy level
  - Emails stored in AgentAction metadata for review
  - Implement email sending on approval via existing email service
  - _Requirements: 7.7, 7.9_

### 11. Next Best Action Agent

- [ ] 11.1 Implement Next Best Action Agent
  - Create `apps/vyntrize-crm/lib/agents/next-best-action-agent.ts`
  - Implement NextBestActionAgent extending Agent base class
  - Build comprehensive lead analysis context
  - Generate 1-3 recommendations using OpenAI Provider
  - Implement rule-based fallback recommendations
  - Calculate engagement metrics (email, website)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_

- [ ]* 11.2 Write unit tests for Next Best Action Agent
  - Test recommendation generation with various lead scenarios
  - Test rule-based fallback logic
  - Test engagement metric calculations
  - Mock OpenAI Provider responses
  - Mock Prisma database calls
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11.3 Implement recommendation caching
  - Cache recommendations for 1 hour to reduce API calls
  - _Requirements: 8.7_

### 12. Checkpoint - Core Agents Complete

- [ ] 12.1 Verify all core agents are working
  - Ensure all tests pass
  - Test Lead Scoring Agent calculates scores correctly
  - Test Task Automation Agent creates tasks on stage changes
  - Test Stagnation Detection Agent identifies stagnant leads
  - Test Email Generation Agent generates emails with AI
  - Test Next Best Action Agent provides recommendations
  - Ask the user if questions arise

## Phase 3: Agent Management APIs

### 13. Agent Actions API

- [ ] 13.1 Implement GET /api/agents/actions endpoint
  - Create `apps/vyntrize-crm/app/api/agents/actions/route.ts`
  - Implement GET handler with filtering by leadId, agentType, status
  - Add pagination support
  - Include lead and contact information in response
  - _Requirements: 13.1, 13.9_

- [ ]* 13.2 Write integration tests for actions API
  - Test filtering by different parameters
  - Test pagination
  - Test authentication and authorization
  - _Requirements: 13.1_

- [ ] 13.3 Implement POST /api/agents/actions/:actionId/approve endpoint
  - Create `apps/vyntrize-crm/app/api/agents/actions/[actionId]/approve/route.ts`
  - Implement approval workflow with user attribution
  - Execute approved actions (email send, stage change, etc.)
  - Handle execution errors and update action status
  - _Requirements: 13.3, 7.9_

- [ ]* 13.4 Write integration tests for approval API
  - Test approval workflow
  - Test action execution for different action types
  - Test error handling
  - Test authorization checks
  - _Requirements: 13.3_

- [ ] 13.5 Implement POST /api/agents/actions/:actionId/reject endpoint
  - Create `apps/vyntrize-crm/app/api/agents/actions/[actionId]/reject/route.ts`
  - Implement rejection workflow with reason
  - Update action status to REJECTED
  - _Requirements: 13.3_

### 14. Agent Metrics and Health APIs

- [ ] 14.1 Implement GET /api/agents/metrics endpoint
  - Create `apps/vyntrize-crm/app/api/agents/metrics/route.ts`
  - Calculate agent performance metrics (action counts, approval rates, execution times)
  - Support filtering by agentType and date range
  - _Requirements: 13.4, 19.1, 19.2_

- [ ] 14.2 Implement GET /api/agents/health endpoint
  - Create `apps/vyntrize-crm/app/api/agents/health/route.ts`
  - Return agent system health status
  - Include job queue metrics from BullMQ
  - Include OpenAI provider status
  - _Requirements: 1.8, 19.7, 19.8_

- [ ] 14.3 Implement POST /api/agents/trigger endpoint
  - Create `apps/vyntrize-crm/app/api/agents/trigger/route.ts`
  - Allow manual triggering of agents for specific leads
  - Validate agentType and leadId
  - Execute agent and return result
  - _Requirements: 13.8_

### 15. Security and Validation

- [ ] 15.1 Implement authentication and authorization middleware
  - Create `apps/vyntrize-crm/lib/agents/auth.ts`
  - Implement requireAgentAccess() for admin-only endpoints
  - Implement requireAgentApproval() for approval authorization
  - _Requirements: 16.7, 16.8, 13.10_

- [ ] 15.2 Implement input validation schemas
  - Create `apps/vyntrize-crm/lib/agents/validation.ts`
  - Define Zod schemas for agent contexts and requests
  - Implement validation functions
  - _Requirements: 16.1, 16.2_

- [ ] 15.3 Implement rate limiting
  - Create `apps/vyntrize-crm/lib/agents/rate-limiter.ts`
  - Implement RateLimiter class using Redis
  - Add rate limiting to agent API endpoints
  - _Requirements: 16.5_

- [ ]* 15.4 Write security tests
  - Test authentication requirements
  - Test authorization checks
  - Test input validation
  - Test rate limiting
  - _Requirements: 16.1, 16.5, 16.7, 16.8_

### 16. Event Integration

- [ ] 16.1 Integrate Event Bus with CRM actions
  - Emit lead_created event when leads are created
  - Emit lead_updated event when leads are updated
  - Emit stage_changed event when lead stage changes
  - Emit email_opened and email_clicked events from email tracking
  - Emit task_completed event when tasks are completed
  - _Requirements: 1.1, 3.10, 4.10_

- [ ]* 16.2 Write integration tests for event emission
  - Test events are emitted correctly from CRM actions
  - Test agents receive and process events
  - Test end-to-end workflows (stage change → task creation)
  - _Requirements: 1.1, 1.2_

### 17. Agent Registry and Initialization

- [ ] 17.1 Implement Agent Registry
  - Create `apps/vyntrize-crm/lib/agents/registry.ts`
  - Implement AgentRegistry class to manage all agents
  - Add registerAllAgents() to initialize all agents
  - Register agents with Event Bus and Job Scheduler
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 17.2 Initialize agents on application startup
  - Call registerAllAgents() in Next.js app initialization
  - Ensure agents are ready before handling requests
  - _Requirements: 1.1, 1.2, 1.3_

### 18. Checkpoint - APIs and Integration Complete

- [ ] 18.1 Verify all APIs and integrations are working
  - Ensure all tests pass
  - Test agent actions API returns correct data
  - Test approval workflow works end-to-end
  - Test metrics and health endpoints return accurate data
  - Test manual agent triggering works
  - Test events are emitted and processed correctly
  - Ask the user if questions arise

## Phase 4: Advanced Features (Optional)

### 19. Predictive Analytics Agent

- [ ] 19.1 Implement Predictive Analytics Agent
  - Create `apps/vyntrize-crm/lib/agents/predictive-analytics-agent.ts`
  - Implement PredictiveAnalyticsAgent extending Agent base class
  - Calculate win probability based on lead features
  - Predict close date based on historical data
  - Store predictions with confidence intervals
  - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6, 9.7_

- [ ]* 19.2 Write unit tests for Predictive Analytics Agent
  - Test win probability calculation
  - Test close date prediction
  - Test prediction accuracy tracking
  - Mock Prisma database calls
  - _Requirements: 9.1, 9.2, 9.3, 9.8_

- [ ] 19.3 Register Predictive Analytics Agent with Job Scheduler
  - Schedule daily batch job to update predictions for all active leads
  - _Requirements: 9.4, 9.10_

### 20. Stage Progression Agent

- [ ] 20.1 Implement Stage Progression Agent
  - Create `apps/vyntrize-crm/lib/agents/stage-progression-agent.ts`
  - Implement StageProgressionAgent extending Agent base class
  - Define stage progression criteria
  - Generate stage change recommendations with reasoning
  - _Requirements: 10.1, 10.2, 10.3_

- [ ]* 20.2 Write unit tests for Stage Progression Agent
  - Test stage progression criteria evaluation
  - Test recommendation generation
  - Test manual override flag handling
  - Mock Prisma database calls
  - _Requirements: 10.1, 10.2, 10.8_

- [ ] 20.3 Register Stage Progression Agent with Event Bus
  - Register for lead_updated and task_completed events
  - _Requirements: 10.7_

### 21. Drip Campaign Agent

- [ ] 21.1 Implement Drip Campaign Agent
  - Create `apps/vyntrize-crm/lib/agents/drip-campaign-agent.ts`
  - Implement DripCampaignAgent extending Agent base class
  - Support multi-step email sequences with delays
  - Integrate with Email Generation Agent for personalization
  - Track sequence completion and engagement
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ]* 21.2 Write unit tests for Drip Campaign Agent
  - Test sequence scheduling logic
  - Test email timing based on opens
  - Test sequence stopping conditions
  - Mock Email Generation Agent and Prisma calls
  - _Requirements: 11.2, 11.3, 11.4, 11.5_

- [ ] 21.3 Register Drip Campaign Agent with Job Scheduler
  - Schedule job every 5 minutes to process scheduled emails
  - _Requirements: 11.10_

### 22. Revenue Forecasting Agent

- [ ] 22.1 Implement Revenue Forecasting Agent
  - Create `apps/vyntrize-crm/lib/agents/revenue-forecasting-agent.ts`
  - Implement RevenueForecastingAgent extending Agent base class
  - Calculate monthly revenue forecast weighted by win probability
  - Generate optimistic, realistic, pessimistic scenarios
  - Identify at-risk deals
  - Track forecast accuracy
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ]* 22.2 Write unit tests for Revenue Forecasting Agent
  - Test forecast calculation logic
  - Test scenario generation
  - Test at-risk deal identification
  - Mock Predictive Analytics Agent and Prisma calls
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 22.3 Register Revenue Forecasting Agent with Job Scheduler
  - Schedule daily batch job to update forecasts
  - _Requirements: 12.9_

- [ ] 22.4 Implement forecast API endpoint
  - Create GET /api/agents/forecast endpoint
  - Return forecast data for dashboard visualization
  - _Requirements: 12.10_

### 23. Agent Dashboard UI

- [ ] 23.1 Create Agent Dashboard page
  - Create `apps/vyntrize-crm/app/(crm)/agents/page.tsx`
  - Display list of recent agent actions with filters
  - Show pending actions requiring approval
  - Display agent performance metrics
  - _Requirements: 13.1, 13.2, 13.4_

- [ ] 23.2 Implement action approval UI
  - Add approve/reject buttons for pending actions
  - Show action reasoning and metadata
  - Display confirmation dialogs
  - _Requirements: 13.2, 13.3, 13.9_

- [ ] 23.3 Implement agent configuration UI
  - Allow admins to create, update, delete agent rules
  - Configure autonomy levels for each action type
  - Display agent health status
  - _Requirements: 13.5, 13.6, 13.7_

- [ ] 23.4 Add manual agent trigger UI
  - Allow users to manually trigger agents for specific leads
  - Display agent execution results
  - _Requirements: 13.8_

### 24. Performance Optimization

- [ ] 24.1 Implement caching layer
  - Create `apps/vyntrize-crm/lib/agents/cache.ts`
  - Implement AgentCache class using Redis
  - Cache agent rules, lead scores, recommendations
  - _Requirements: 15.5_

- [ ] 24.2 Implement batch processing utility
  - Create `apps/vyntrize-crm/lib/agents/batch-processor.ts`
  - Implement BatchProcessor for efficient bulk operations
  - _Requirements: 15.2_

- [ ] 24.3 Add database indexes and materialized views
  - Create indexes for common agent queries
  - Create materialized view for agent metrics summary
  - _Requirements: 15.6_

- [ ]* 24.4 Write performance tests
  - Test batch job execution time for 1000 leads
  - Test event processing latency
  - Verify 95th percentile < 500ms for event-driven agents
  - _Requirements: 15.1, 15.2_

### 25. Monitoring and Observability

- [ ] 25.1 Implement Prometheus metrics
  - Add metrics for agent execution count, duration, error rate
  - Add metrics for job queue depth and processing rate
  - Add metrics for OpenAI API usage
  - _Requirements: 19.1, 19.2, 19.3_

- [ ] 25.2 Implement alerting
  - Configure alerts for high error rates
  - Configure alerts for queue depth
  - Configure alerts for OpenAI rate limits
  - _Requirements: 19.4, 19.5, 19.6_

- [ ] 25.3 Add distributed tracing
  - Integrate OpenTelemetry for request tracing
  - _Requirements: 19.9_

### 26. Documentation

- [ ] 26.1 Write README documentation
  - Document architecture overview
  - Document setup instructions
  - Document environment variables
  - _Requirements: 20.1_

- [ ] 26.2 Write API documentation
  - Generate OpenAPI specification for agent endpoints
  - Document request/response formats
  - _Requirements: 20.2_

- [ ] 26.3 Write developer guide
  - Document how to create new agents
  - Provide code examples
  - Document testing patterns
  - _Requirements: 20.3, 20.4_

- [ ] 26.4 Write troubleshooting guide
  - Document common issues and solutions
  - Document debugging techniques
  - _Requirements: 20.7_

### 27. Final Checkpoint - System Complete

- [ ] 27.1 Verify complete system is working
  - Ensure all tests pass (unit, integration, performance)
  - Test all agents in production-like environment
  - Test all APIs and UI components
  - Verify monitoring and alerting is working
  - Review documentation completeness
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Phase 1 (Foundation) must be completed before Phase 2 (Core Agents)
- Phase 2 must be completed before Phase 3 (APIs and Integration)
- Phase 4 (Advanced Features) is optional and can be implemented incrementally
- All agents follow the same base class pattern for consistency
- Event-driven agents respond to real-time CRM events
- Scheduled agents run periodic batch jobs for analysis
- All agent actions include reasoning for explainability
- Autonomy levels control whether actions execute automatically or require approval
