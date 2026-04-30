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
    
    echo '📦 Installing seed dependencies...' && \
    pnpm add bcryptjs tsx @types/bcryptjs @types/node --save-dev && \
    
    echo '📦 Copying seed script...' && \
    cp /app/crm/scripts/seed-users.ts /app/seed/ && \
    
    echo '🌱 Running seed script...' && \
    pnpm exec tsx seed-users.ts
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
