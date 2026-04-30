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

# Step 1: Clean the crm_users table
echo "🗑️  Deleting all users from crm_users table..."
docker exec -it deploy-vyntrize-postgres-1 psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "DELETE FROM crm_users;"

echo "✅ Users table cleaned"

# Step 2: Run seed script
echo ""
echo "🌱 Seeding CRM users..."

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
