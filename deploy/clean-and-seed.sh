#!/bin/bash
set -e

echo "🧹 Cleaning and reseeding CRM database..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "⚠️  This will delete all users from the crm_users table!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Step 1: Initialize Database

echo ""
echo "🌱 Seeding CRM users..."

docker run --rm \
  --network review-rise-monorepo_reviewrise-network \
  -e CRM_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@vyntrize-postgres:5432/${POSTGRES_DB}" \
  -e VYNTRIZE_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@vyntrize-postgres:5432/${POSTGRES_DB}" \
  -v "$(pwd)/standalone-seed.ts:/app/seed.ts:ro" \
  -v "$(pwd)/../packages/@platform/vyntrize-db/prisma:/app/prisma-source:ro" \
  -v "$(pwd)/../packages/@platform/vyntrize-db/prisma.config.ts:/app/prisma.config.ts:ro" \
  -w /app \
  node:22-alpine \
  sh -c "
    echo '📦 Setting up environment...' && \
    corepack enable && corepack prepare pnpm@9 --activate && \
    
    echo '📦 Installing dependencies...' && \
    pnpm add prisma@7.8.0 @prisma/client@7.8.0 @prisma/config@7.8.0 dotenv bcryptjs tsx @types/node pg @types/pg @prisma/adapter-pg@7.8.0 && \
    
    echo '📦 Copying Prisma schema without custom output...' && \
    mkdir -p prisma && \
    cp /app/prisma-source/schema.prisma prisma/schema.prisma && \
    sed -i '/output.*=.*\"..\/src\/generated\/client\"/d' prisma/schema.prisma && \
    sed -i '/provider = "postgresql"/a \  url = env("CRM_DATABASE_URL")' prisma/schema.prisma && \
    
    echo '📦 Generating Prisma client...' && \
    pnpm exec prisma generate && \
    
    echo '🚀 Pushing schema to database...' && \
    pnpm exec prisma db push --accept-data-loss && \
    
    echo '🌱 Running seed script...' && \
    pnpm exec tsx seed.ts
  "

echo ""
echo "✅ Seeding complete!"
echo ""
echo "📋 Verifying users in database..."
docker exec -it deploy-vyntrize-postgres-1 psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT email, \"displayName\", role, \"isActive\" FROM crm_users ORDER BY role DESC, email;"

echo ""
echo "🔑 Login credentials:"
echo "   Default password for all users: Vyntrise2026!"
echo ""
echo "   Admin users:"
echo "     - abdisa@vyntrise.com"
echo "     - abenezer@vyntrise.com"
echo ""
echo "   Member users:"
echo "     - abel@vyntrise.com"
echo "     - biniyam@vyntrise.com"
echo "     - gedion@vyntrise.com"
echo "     - mahlet@vyntrise.com"
echo "     - mesay@vyntrise.com"
