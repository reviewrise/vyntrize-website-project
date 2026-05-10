# Database Migration Guide - AI Pipeline Agent System

Complete guide for applying the agent system database migration.

## Overview

The AI Pipeline Agent System requires database schema changes to add three new tables and update the Lead model. This guide covers the migration process for development, staging, and production environments.

## Migration Details

**Migration Name:** `20260506113948_add_agent_system`  
**Location:** `packages/@platform/vyntrize-db/prisma/migrations/20260506113948_add_agent_system/migration.sql`

### New Tables

1. **agent_actions** - Stores all agent actions with reasoning and metadata
2. **agent_rules** - Configurable agent rules (for future use)
3. **agent_metrics** - Performance metrics and tracking

### Modified Tables

1. **crm_leads** - Added fields:
   - `score` (Int, default 0)
   - `qualificationStatus` (String, default "new")
   - `lastActivityAt` (DateTime, nullable)

### New Enums

1. **AgentType** - 10 agent types
2. **ActionType** - 6 action types
3. **ActionStatus** - 5 statuses
4. **AutonomyLevel** - 3 levels

## Pre-Migration Checklist

- [ ] Database backup created
- [ ] Migration file reviewed
- [ ] Downtime window scheduled (if needed)
- [ ] Team notified
- [ ] Rollback plan documented

## Development Environment

### Step 1: Backup Database (Optional but Recommended)

```bash
# PostgreSQL backup
pg_dump -h localhost -U vyntrize_user -d vyntrize_db > backup_dev_$(date +%Y%m%d_%H%M%S).sql

# Or using Docker
docker exec vyntrize-postgres pg_dump -U vyntrize_user vyntrize_db > backup_dev_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Apply Migration

```bash
cd packages/@platform/vyntrize-db

# Apply migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

Expected output:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "vyntrize_db"

1 migration found in prisma/migrations

Applying migration `20260506113948_add_agent_system`

The following migration(s) have been applied:

migrations/
  └─ 20260506113948_add_agent_system/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### Step 3: Verify Migration

```bash
# Check tables exist
psql -h localhost -U vyntrize_user -d vyntrize_db -c "\dt agent_*"

# Check Lead table columns
psql -h localhost -U vyntrize_user -d vyntrize_db -c "\d crm_leads"

# Check enums
psql -h localhost -U vyntrize_user -d vyntrize_db -c "\dT+ \"AgentType\""
```

Expected output:
```
                List of relations
 Schema |      Name       | Type  |     Owner      
--------+-----------------+-------+----------------
 public | agent_actions   | table | vyntrize_user
 public | agent_metrics   | table | vyntrize_user
 public | agent_rules     | table | vyntrize_user
```

### Step 4: Test Application

```bash
cd apps/vyntrize-crm
pnpm dev

# Check logs for successful initialization
# Look for: [AgentSystem] Agent system initialized successfully
```

## Staging Environment

### Step 1: Create Backup

```bash
# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -h staging-db.example.com -U vyntrize_user -d vyntrize_db > backup_staging_$TIMESTAMP.sql

# Verify backup
ls -lh backup_staging_$TIMESTAMP.sql

# Store backup securely
aws s3 cp backup_staging_$TIMESTAMP.sql s3://backups/staging/
```

### Step 2: Apply Migration

```bash
cd packages/@platform/vyntrize-db

# Set database URL for staging
export DATABASE_URL="postgresql://user:pass@staging-db:5432/vyntrize_db"

# Apply migration
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### Step 3: Verify Migration

```bash
# Connect to staging database
psql $DATABASE_URL

# Verify tables
\dt agent_*

# Verify Lead columns
\d crm_leads

# Check row counts (should be 0 for new tables)
SELECT 'agent_actions' as table_name, COUNT(*) FROM agent_actions
UNION ALL
SELECT 'agent_rules', COUNT(*) FROM agent_rules
UNION ALL
SELECT 'agent_metrics', COUNT(*) FROM agent_metrics;
```

### Step 4: Deploy Application

```bash
cd apps/vyntrize-crm

# Build
pnpm build

# Deploy (method depends on your infrastructure)
# PM2:
pm2 reload vyntrize-crm

# Docker:
docker-compose up -d --no-deps --build vyntrize-crm

# Kubernetes:
kubectl rollout restart deployment/vyntrize-crm
```

### Step 5: Smoke Test

```bash
# Health check
curl https://staging.example.com/api/agents/health

# Should return:
# {
#   "status": "healthy",
#   "components": {
#     "agentRegistry": { "status": "healthy", "initialized": true },
#     ...
#   }
# }
```

## Production Environment

### Step 1: Pre-Migration Checklist

- [ ] Staging migration successful
- [ ] Staging tests passed
- [ ] Backup strategy confirmed
- [ ] Rollback plan documented
- [ ] Maintenance window scheduled (if needed)
- [ ] Team on standby
- [ ] Monitoring configured

### Step 2: Create Production Backup

```bash
# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -h prod-db.example.com -U vyntrize_user -d vyntrize_db > backup_prod_$TIMESTAMP.sql

# Compress backup
gzip backup_prod_$TIMESTAMP.sql

# Verify backup integrity
gunzip -t backup_prod_$TIMESTAMP.sql.gz

# Store in multiple locations
aws s3 cp backup_prod_$TIMESTAMP.sql.gz s3://backups/production/
scp backup_prod_$TIMESTAMP.sql.gz backup-server:/backups/

# Verify backup size and integrity
ls -lh backup_prod_$TIMESTAMP.sql.gz
md5sum backup_prod_$TIMESTAMP.sql.gz
```

### Step 3: Apply Migration (Zero-Downtime)

The migration is **non-breaking** and can be applied without downtime:

```bash
cd packages/@platform/vyntrize-db

# Set production database URL
export DATABASE_URL="postgresql://user:pass@prod-db:5432/vyntrize_db"

# Apply migration
npx prisma migrate deploy

# Generate client
npx prisma generate
```

**Why Zero-Downtime:**
- Only adds new tables (doesn't modify existing data)
- Adds new columns with defaults (doesn't break existing queries)
- Application continues to work during migration

### Step 4: Deploy Application

```bash
cd apps/vyntrize-crm

# Build
pnpm install --frozen-lockfile --production
pnpm build

# Deploy with zero-downtime
# PM2:
pm2 reload vyntrize-crm

# Docker (rolling update):
docker-compose up -d --no-deps --build vyntrize-crm

# Kubernetes (rolling update):
kubectl rollout restart deployment/vyntrize-crm
kubectl rollout status deployment/vyntrize-crm
```

### Step 5: Verify Production

```bash
# Health check
curl https://app.example.com/api/agents/health

# Check metrics
curl https://app.example.com/api/agents/metrics?days=1

# Verify database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM agent_actions;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM crm_leads WHERE score IS NOT NULL;"
```

### Step 6: Monitor

Monitor for 1-2 hours:
- Application logs for errors
- Database performance
- Agent system initialization
- Health endpoint status
- Error rates

## Docker Deployment

### Using Docker Compose

```bash
cd deploy

# Backup database
docker-compose exec vyntrize-postgres pg_dump -U vyntrize_user vyntrize_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migration
docker-compose exec vyntrize-crm npx prisma migrate deploy

# Restart application (if needed)
docker-compose restart vyntrize-crm

# Verify
docker-compose exec vyntrize-crm npx prisma migrate status
```

## Rollback Procedures

### Scenario 1: Migration Failed

If migration fails during application:

```bash
# Check migration status
npx prisma migrate status

# View error details
cat packages/@platform/vyntrize-db/prisma/migrations/migration_lock.toml

# Fix issue and retry
npx prisma migrate deploy
```

### Scenario 2: Need to Rollback

**Option A: Restore from Backup (Recommended)**

```bash
# Stop application
pm2 stop vyntrize-crm

# Restore database
psql -h localhost -U vyntrize_user -d vyntrize_db < backup_TIMESTAMP.sql

# Start application
pm2 start vyntrize-crm
```

**Option B: Manual Rollback (Advanced)**

```bash
# Connect to database
psql -h localhost -U vyntrize_user -d vyntrize_db

-- Drop new tables
DROP TABLE IF EXISTS agent_actions CASCADE;
DROP TABLE IF EXISTS agent_rules CASCADE;
DROP TABLE IF EXISTS agent_metrics CASCADE;

-- Drop new enums
DROP TYPE IF EXISTS "AgentType";
DROP TYPE IF EXISTS "ActionType";
DROP TYPE IF EXISTS "ActionStatus";
DROP TYPE IF EXISTS "AutonomyLevel";

-- Remove new columns from Lead
ALTER TABLE crm_leads DROP COLUMN IF EXISTS score;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS qualificationStatus;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS lastActivityAt;

-- Update migration history
DELETE FROM _prisma_migrations WHERE migration_name = '20260506113948_add_agent_system';
```

## Troubleshooting

### Issue: "Migration already applied"

```bash
# Check migration status
npx prisma migrate status

# If already applied, just generate client
npx prisma generate
```

### Issue: "Database connection failed"

```bash
# Verify database URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check database is running
pg_isready -h localhost -p 5432
```

### Issue: "Permission denied"

```bash
# Verify user has CREATE TABLE permission
psql $DATABASE_URL -c "SELECT has_table_privilege('vyntrize_user', 'crm_leads', 'INSERT');"

# Grant permissions if needed (as superuser)
psql -U postgres -d vyntrize_db -c "GRANT ALL ON SCHEMA public TO vyntrize_user;"
```

### Issue: "Enum already exists"

```bash
# Check if enums exist
psql $DATABASE_URL -c "\dT"

# If migration partially applied, complete it manually
psql $DATABASE_URL -f packages/@platform/vyntrize-db/prisma/migrations/20260506113948_add_agent_system/migration.sql
```

## Verification Checklist

After migration, verify:

- [ ] All three new tables exist
- [ ] Lead table has new columns
- [ ] All enums are created
- [ ] Indexes are created
- [ ] Foreign keys are set up
- [ ] Application starts successfully
- [ ] Health endpoint returns "healthy"
- [ ] No errors in application logs
- [ ] Can create agent actions
- [ ] Can query agent metrics

## Post-Migration Tasks

1. **Update Documentation**
   - Document migration date
   - Update schema diagrams
   - Note any issues encountered

2. **Monitor Performance**
   - Watch database query performance
   - Monitor table sizes
   - Check index usage

3. **Clean Up**
   - Archive old backups
   - Remove temporary files
   - Update runbooks

## Migration SQL Preview

For reference, here's what the migration does:

```sql
-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('LEAD_SCORING', 'TASK_AUTOMATION', ...);
CREATE TYPE "ActionType" AS ENUM ('SCORE_UPDATE', 'TASK_CREATE', ...);
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'APPROVED', ...);
CREATE TYPE "AutonomyLevel" AS ENUM ('FULLY_AUTONOMOUS', ...);

-- CreateTable
CREATE TABLE "agent_actions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentType" "AgentType" NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "leadId" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    ...
);

-- CreateTable
CREATE TABLE "agent_rules" (...);
CREATE TABLE "agent_metrics" (...);

-- AlterTable
ALTER TABLE "crm_leads" 
    ADD COLUMN "score" INTEGER DEFAULT 0,
    ADD COLUMN "qualificationStatus" TEXT DEFAULT 'new',
    ADD COLUMN "lastActivityAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "agent_actions_leadId_idx" ON "agent_actions"("leadId");
...
```

## Support

For migration issues:
1. Check Prisma migration status
2. Review database logs
3. Verify user permissions
4. Check connection string
5. Consult troubleshooting section
6. Restore from backup if needed

---

**Migration Checklist:**
- [ ] Backup created
- [ ] Migration applied
- [ ] Client generated
- [ ] Tables verified
- [ ] Application deployed
- [ ] Health check passed
- [ ] Monitoring active
- [ ] Documentation updated
