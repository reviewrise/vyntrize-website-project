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
  -e CRM_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@vyntrize-postgres:5432/${POSTGRES_DB}" \
  -v "$(pwd)/standalone-seed.ts:/app/seed.ts:ro" \
  -v "$(pwd)/../packages/@platform/vyntrize-db/prisma:/app/prisma:ro" \
  -v "$(pwd)/../packages/@platform/vyntrize-db/prisma.config.ts:/app/prisma.config.ts:ro" \
  -w /app \
  node:20-alpine \
  sh -c "
    echo '📦 Setting up environment...' && \
    corepack enable && corepack prepare pnpm@latest --activate && \
    
    echo '📦 Installing dependencies...' && \
    pnpm add -g prisma@7.8.0 @prisma/client@7.8.0 bcryptjs tsx @types/node && \
    
    echo '📦 Generating Prisma client...' && \
    prisma generate && \
    
    echo '🌱 Running seed script...' && \
    tsx seed.ts
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
