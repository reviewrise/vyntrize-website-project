#!/bin/bash
set -e

echo "🌱 Seeding CRM users..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Run seed script in temporary container
docker run --rm \
  --network review-rise-monorepo_reviewrise-network \
  -e CI=true \
  -e CRM_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@vyntrize-postgres:5432/${POSTGRES_DB}" \
  -v "$(pwd)/../apps/vyntrize-crm:/app/crm" \
  -v "$(pwd)/../packages/@platform/vyntrize-db:/app/db" \
  -w /app \
  node:20-alpine \
  sh -c "
    echo '📦 Installing pnpm...' && \
    corepack enable && corepack prepare pnpm@latest --activate && \
    echo '📦 Installing database dependencies...' && \
    cd /app/db && pnpm install && \
    echo '📦 Installing CRM dependencies...' && \
    cd /app/crm && pnpm install && \
    echo '🌱 Running seed script...' && \
    pnpm seed:users
  "

echo "✅ Seeding complete!"
echo ""
echo "Default password for all users: Vyntrise2026!"
echo ""
echo "Users created:"
echo "  - abdisa@vyntrise.com (ADMIN)"
echo "  - abenezer@vyntrise.com (ADMIN)"
echo "  - biniyam@vyntrise.com (MEMBER)"
echo "  - mesay@vyntrise.com (MEMBER)"
echo "  - gedion@vyntrise.com (MEMBER)"
echo "  - mahlet@vyntrise.com (MEMBER)"
echo "  - abel@vyntrise.com (MEMBER)"
