#!/bin/bash
# Production database migration script

set -e

echo "🔄 Running database migrations on production..."

# Navigate to the vyntrize-db package
cd /home/deploy/vyntrize-website-project/packages/@platform/vyntrize-db

# Run migrations
pnpm prisma migrate deploy

# Regenerate Prisma client
pnpm prisma generate

echo "✅ Database migrations completed successfully!"
