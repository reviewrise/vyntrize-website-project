# Analytics & CRM Extension - Deployment Guide

## 🚀 Production Deployment Guide

This guide walks you through deploying the Analytics & CRM Extension to your production server.

---

## Prerequisites

- [x] All code committed and pushed to GitHub
- [ ] SSH access to production server
- [ ] Database backup completed
- [ ] Downtime window scheduled (if needed)
- [ ] Team notified of deployment

---

## Deployment Steps

### Step 1: Backup Production Database

**On Production Server:**

```bash
# SSH into production server
ssh deploy@your-server.com

# Navigate to project directory
cd /home/deploy/vyntrize-website-project

# Create backup
sudo -u postgres pg_dump vyntrize_db > ~/backups/vyntrize_db_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh ~/backups/
```

**Expected Output:**
```
-rw-r--r-- 1 deploy deploy 45M May  1 10:00 vyntrize_db_backup_20260501_100000.sql
```

---

### Step 2: Pull Latest Code

```bash
# Pull latest changes from GitHub
git fetch origin
git pull origin main

# Verify you're on the correct commit
git log -1
```

**Expected Output:**
```
commit e9c73fe... (HEAD -> main, origin/main)
Author: Your Name
Date:   Thu May 1 2026

    docs: add comprehensive project completion summary
```

---

### Step 3: Install Dependencies

```bash
# Install new dependencies (recharts, @headlessui/react)
pnpm install

# Verify installation
pnpm list recharts @headlessui/react
```

**Expected Output:**
```
vyntrize-crm@0.1.0
├── @headlessui/react@2.x.x
└── recharts@2.x.x
```

---

### Step 4: Apply Database Migration

```bash
# Navigate to database package
cd packages/@platform/vyntrize-db

# Apply migration (no shadow database needed)
pnpm prisma migrate deploy

# Regenerate Prisma client
pnpm prisma generate

# Return to root
cd ../../..
```

**Expected Output:**
```
✓ Migration 20260501183025_add_analytics_and_crm_enhancements applied successfully
✓ Prisma Client generated successfully
```

**Verify Migration:**
```bash
# Check if new tables exist
sudo -u postgres psql vyntrize_db -c "\dt analytics_*"
```

**Expected Output:**
```
                    List of relations
 Schema |           Name            | Type  |  Owner   
--------+---------------------------+-------+----------
 public | analytics_daily_metrics   | table | postgres
 public | analytics_events          | table | postgres
 public | analytics_sessions        | table | postgres
```

---

### Step 5: Build Applications

```bash
# Build website
cd apps/vyntrize-website
pnpm build

# Build CRM
cd ../vyntrize-crm
pnpm build

# Return to root
cd ../..
```

**Expected Output:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

---

### Step 6: Restart Services

**Using Docker Compose:**

```bash
# Stop services
docker-compose down

# Rebuild images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

**Using PM2 (if not using Docker):**

```bash
# Restart website
pm2 restart vyntrize-website

# Restart CRM
pm2 restart vyntrize-crm

# Check status
pm2 status
```

**Expected Output:**
```
┌─────┬────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ status  │ restart │ uptime   │
├─────┼────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ vyntrize-website   │ online  │ 0       │ 2s       │
│ 1   │ vyntrize-crm       │ online  │ 0       │ 2s       │
└─────┴────────────────────┴─────────┴─────────┴──────────┘
```

---

### Step 7: Setup Background Jobs

**Create Cron Jobs:**

```bash
# Edit crontab
crontab -e
```

**Add these lines:**

```bash
# Score Recalculation - Every hour
0 * * * * cd /home/deploy/vyntrize-website-project/apps/vyntrize-crm && /usr/local/bin/tsx lib/jobs/recalculate-scores.ts >> /var/log/vyntrize/score-recalc.log 2>&1

# Daily Metrics Aggregation - Every day at 1 AM
0 1 * * * cd /home/deploy/vyntrize-website-project/apps/vyntrize-crm && /usr/local/bin/tsx lib/jobs/aggregate-daily-metrics.ts yesterday >> /var/log/vyntrize/daily-metrics.log 2>&1
```

**Create log directory:**

```bash
sudo mkdir -p /var/log/vyntrize
sudo chown deploy:deploy /var/log/vyntrize
```

**Verify cron jobs:**

```bash
crontab -l
```

---

### Step 8: Backfill Historical Analytics Data

**Run backfill for last 30 days:**

```bash
cd apps/vyntrize-crm
tsx lib/jobs/aggregate-daily-metrics.ts backfill 30
```

**Expected Output:**
```
Backfilling metrics for the last 30 days...
Aggregating metrics for 2026-04-01
✓ Aggregated metrics for 2026-04-01
  - Sessions: 245
  - Unique Visitors: 189
  - Page Views: 1,234
  - Conversions: 12
...
✓ Backfill complete
```

**Note:** This may take several minutes depending on data volume.

---

### Step 9: Verify Deployment

**Check Website:**

```bash
# Test website homepage
curl -I https://vyntrize.com

# Test analytics tracking endpoint
curl -X POST https://vyntrize.com/api/track \
  -H "Content-Type: application/json" \
  -d '{"eventType":"page_view","pageUrl":"/test"}'
```

**Expected Output:**
```
HTTP/2 200
content-type: application/json
```

**Check CRM:**

```bash
# Test CRM login page
curl -I https://crm.vyntrize.com/login

# Test analytics dashboard API (requires auth)
curl https://crm.vyntrize.com/api/analytics/dashboard?startDate=2026-04-01&endDate=2026-05-01
```

**Manual Verification:**

1. **Website (https://vyntrize.com)**
   - [ ] Homepage loads correctly
   - [ ] No console errors
   - [ ] Analytics tracker initializes
   - [ ] Cookie consent banner appears

2. **CRM (https://crm.vyntrize.com)**
   - [ ] Login page loads
   - [ ] Can log in successfully
   - [ ] Dashboard displays
   - [ ] Sidebar shows new links (Tasks, Email Templates, Analytics)

3. **Analytics Dashboard**
   - [ ] Navigate to Analytics
   - [ ] Metrics cards display
   - [ ] Charts render correctly
   - [ ] Date range selector works
   - [ ] No console errors

4. **Lead Detail Page**
   - [ ] Open any lead
   - [ ] Lead score widget displays
   - [ ] Activity timeline shows
   - [ ] Notes section appears in sidebar
   - [ ] All components load without errors

5. **New Features**
   - [ ] Tasks page loads (`/tasks`)
   - [ ] Email Templates page loads (`/email-templates`)
   - [ ] Pipeline Settings page loads (`/settings/pipeline`)
   - [ ] Analytics Reports page loads (`/analytics/reports`)

---

### Step 10: Monitor for Issues

**Check Application Logs:**

```bash
# Docker logs
docker-compose logs -f --tail=100 vyntrize-website
docker-compose logs -f --tail=100 vyntrize-crm

# PM2 logs
pm2 logs vyntrize-website --lines 100
pm2 logs vyntrize-crm --lines 100
```

**Check Background Job Logs:**

```bash
# Score recalculation
tail -f /var/log/vyntrize/score-recalc.log

# Daily metrics
tail -f /var/log/vyntrize/daily-metrics.log
```

**Check Database Performance:**

```bash
# Check active connections
sudo -u postgres psql vyntrize_db -c "SELECT count(*) FROM pg_stat_activity;"

# Check table sizes
sudo -u postgres psql vyntrize_db -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"
```

---

## Post-Deployment Tasks

### 1. Test Analytics Tracking

**Visit website and perform actions:**

```bash
# Open browser and visit
https://vyntrize.com

# Navigate to different pages
# Fill out contact form
# Check if events are being tracked
```

**Verify in database:**

```bash
sudo -u postgres psql vyntrize_db -c "
SELECT 
  event_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type;
"
```

**Expected Output:**
```
 event_type  | count |         latest          
-------------+-------+-------------------------
 page_view   |    15 | 2026-05-01 10:30:45.123
 form_submit |     2 | 2026-05-01 10:28:12.456
```

---

### 2. Test Lead Scoring

**Create a test lead:**

```bash
# Via CRM UI or API
# Then check if score is calculated
```

**Verify in database:**

```bash
sudo -u postgres psql vyntrize_db -c "
SELECT 
  id,
  title,
  score,
  qualification_status,
  last_activity_at
FROM crm_leads
ORDER BY created_at DESC
LIMIT 5;
"
```

---

### 3. Run Manual Score Recalculation

```bash
cd apps/vyntrize-crm
tsx lib/jobs/recalculate-scores.ts
```

**Expected Output:**
```
Recalculating lead scores...
✓ Recalculated 45 lead scores
  - 5 leads moved to HOT
  - 12 leads moved to WARM
  - 28 leads remain COLD
```

---

### 4. Test Background Jobs

**Wait for next hour and check logs:**

```bash
# Check if score recalculation ran
tail -20 /var/log/vyntrize/score-recalc.log

# Check if daily aggregation will run tomorrow at 1 AM
# Or manually trigger it
cd apps/vyntrize-crm
tsx lib/jobs/aggregate-daily-metrics.ts yesterday
```

---

### 5. Update Documentation

- [ ] Update internal wiki with new features
- [ ] Notify team of new capabilities
- [ ] Schedule training sessions
- [ ] Create user guides

---

## Rollback Procedure

**If issues occur, rollback to previous version:**

### 1. Stop Services

```bash
docker-compose down
# or
pm2 stop all
```

### 2. Restore Database

```bash
# Restore from backup
sudo -u postgres psql vyntrize_db < ~/backups/vyntrize_db_backup_YYYYMMDD_HHMMSS.sql
```

### 3. Revert Code

```bash
# Find previous commit
git log --oneline -10

# Revert to previous commit
git reset --hard <previous-commit-hash>

# Rebuild
pnpm install
cd apps/vyntrize-website && pnpm build
cd ../vyntrize-crm && pnpm build
```

### 4. Restart Services

```bash
docker-compose up -d
# or
pm2 restart all
```

---

## Troubleshooting

### Issue: Migration Fails

**Error:** `Migration failed: relation already exists`

**Solution:**
```bash
# Check migration status
cd packages/@platform/vyntrize-db
pnpm prisma migrate status

# If migration is partially applied, resolve manually
sudo -u postgres psql vyntrize_db

# Then mark migration as applied
pnpm prisma migrate resolve --applied 20260501183025_add_analytics_and_crm_enhancements
```

---

### Issue: Analytics Not Tracking

**Error:** Events not appearing in database

**Solution:**
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check cookie consent status
4. Review server logs

```bash
# Test tracking endpoint
curl -X POST https://vyntrize.com/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "page_view",
    "pageUrl": "/test",
    "visitorId": "test-visitor-123",
    "sessionId": "test-session-456"
  }'
```

---

### Issue: Dashboard Shows No Data

**Error:** Dashboard displays "No data available"

**Solution:**
1. Check if analytics events exist in database
2. Run backfill job to populate aggregated data
3. Verify date range is correct

```bash
# Check for events
sudo -u postgres psql vyntrize_db -c "SELECT COUNT(*) FROM analytics_events;"

# Run backfill
cd apps/vyntrize-crm
tsx lib/jobs/aggregate-daily-metrics.ts backfill 7
```

---

### Issue: Background Jobs Not Running

**Error:** Cron jobs not executing

**Solution:**
1. Check cron service is running
2. Verify crontab entries
3. Check log files for errors

```bash
# Check cron service
sudo systemctl status cron

# View cron logs
sudo tail -f /var/log/syslog | grep CRON

# Test job manually
cd apps/vyntrize-crm
tsx lib/jobs/recalculate-scores.ts
```

---

### Issue: High Database Load

**Error:** Slow queries, high CPU usage

**Solution:**
1. Check for missing indexes
2. Limit date ranges in queries
3. Use aggregated data table

```bash
# Check slow queries
sudo -u postgres psql vyntrize_db -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"

# Add missing indexes if needed
sudo -u postgres psql vyntrize_db -c "
CREATE INDEX CONCURRENTLY idx_analytics_events_created_at 
ON analytics_events(created_at);
"
```

---

## Performance Optimization

### Database Indexes

**Check existing indexes:**

```bash
sudo -u postgres psql vyntrize_db -c "
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'analytics_%'
ORDER BY tablename, indexname;
"
```

**Add additional indexes if needed:**

```sql
-- For analytics queries
CREATE INDEX CONCURRENTLY idx_analytics_events_visitor_id 
ON analytics_events(visitor_id);

CREATE INDEX CONCURRENTLY idx_analytics_events_session_id 
ON analytics_events(session_id);

CREATE INDEX CONCURRENTLY idx_analytics_sessions_started_at 
ON analytics_sessions(started_at);

-- For lead queries
CREATE INDEX CONCURRENTLY idx_lead_activities_lead_id_created_at 
ON lead_activities(lead_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_lead_scores_lead_id_created_at 
ON lead_scores(lead_id, created_at DESC);
```

---

### Archiving Old Data

**Archive analytics events older than 6 months:**

```sql
-- Create archive table
CREATE TABLE analytics_events_archive (LIKE analytics_events INCLUDING ALL);

-- Move old data
INSERT INTO analytics_events_archive
SELECT * FROM analytics_events
WHERE created_at < NOW() - INTERVAL '6 months';

-- Delete from main table
DELETE FROM analytics_events
WHERE created_at < NOW() - INTERVAL '6 months';

-- Vacuum to reclaim space
VACUUM FULL analytics_events;
```

---

## Monitoring & Alerts

### Setup Monitoring

**Key Metrics to Monitor:**

1. **Application Health**
   - Response times
   - Error rates
   - Memory usage
   - CPU usage

2. **Database Performance**
   - Query execution time
   - Connection count
   - Table sizes
   - Index usage

3. **Background Jobs**
   - Job execution time
   - Success/failure rate
   - Last run timestamp

4. **Analytics Data**
   - Events per hour
   - Sessions per day
   - Conversion rate
   - Data quality

**Setup Alerts:**

```bash
# Example: Alert if background job fails
# Add to cron job:
0 * * * * cd /path/to/project && tsx lib/jobs/recalculate-scores.ts || echo "Score recalculation failed" | mail -s "Alert: Job Failed" admin@vyntrize.com
```

---

## Success Criteria

Deployment is successful when:

- [x] All services are running
- [x] Database migration applied
- [x] Website loads without errors
- [x] CRM accessible and functional
- [x] Analytics tracking works
- [x] Dashboard displays data
- [x] Background jobs scheduled
- [x] No critical errors in logs
- [x] Team notified and trained

---

## Support Contacts

**Technical Issues:**
- Development Team: dev@vyntrize.com
- Database Admin: dba@vyntrize.com

**Business Issues:**
- Product Manager: pm@vyntrize.com
- Sales Team Lead: sales@vyntrize.com

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and tested
- [ ] Database backup completed
- [ ] Team notified
- [ ] Downtime window scheduled (if needed)
- [ ] Rollback plan prepared

### During Deployment
- [ ] Pull latest code
- [ ] Install dependencies
- [ ] Apply database migration
- [ ] Build applications
- [ ] Restart services
- [ ] Setup background jobs
- [ ] Backfill historical data

### Post-Deployment
- [ ] Verify website loads
- [ ] Verify CRM loads
- [ ] Test analytics tracking
- [ ] Test new features
- [ ] Monitor logs for errors
- [ ] Check background jobs
- [ ] Update documentation
- [ ] Notify team of completion

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Deployment Status:** ⬜ Success ⬜ Partial ⬜ Rollback  
**Notes:** _____________

---

*For questions or issues during deployment, contact the development team immediately.*
