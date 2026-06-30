#!/bin/bash
# Production database migration script

set -e

echo "🔄 Running database migrations on production..."

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return 0
  fi

  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@9 --activate
    return 0
  fi

  if command -v npm >/dev/null 2>&1; then
    npm install -g pnpm@9
    return 0
  fi

  echo "ERROR: Unable to find pnpm, corepack, or npm on this host" >&2
  exit 1
}

ensure_pnpm

# Navigate to the vyntrize-db package
cd /home/deploy/vyntrize-website-project/packages/@platform/vyntrize-db

# Run migrations
pnpm install
pnpm prisma migrate deploy

# Regenerate Prisma client
pnpm prisma generate

echo "✅ Database migrations completed successfully!"
