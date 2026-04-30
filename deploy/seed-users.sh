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
  -v "$(pwd)/../apps/vyntrize-crm:/app/crm:ro" \
  -v "$(pwd)/../packages/@platform/vyntrize-db:/app/db:ro" \
  -w /app/seed \
  node:20-alpine \
  sh -c "
    echo '📦 Installing pnpm and dependencies...' && \
    corepack enable && corepack prepare pnpm@latest --activate && \
    
    echo '📦 Copying and installing database package...' && \
    cp -r /app/db /app/seed/db && \
    cd /app/seed/db && pnpm install && \
    
    echo '📦 Setting up seed environment...' && \
    cd /app/seed && \
    mkdir -p node_modules/@prisma && \
    ln -s /app/seed/db/src/generated/client node_modules/@prisma/client && \
    ln -s /app/seed/db/node_modules/@prisma/client-runtime-utils node_modules/@prisma/client-runtime-utils && \
    
    echo '📦 Installing seed dependencies...' && \
    pnpm add bcryptjs tsx @types/bcryptjs @types/node --save-dev && \
    
    echo '📦 Copying seed script...' && \
    cp /app/crm/scripts/seed-users.ts /app/seed/ && \
    
    echo '🌱 Running seed script...' && \
    pnpm exec tsx seed-users.ts
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
