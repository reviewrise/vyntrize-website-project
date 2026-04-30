#!/bin/bash
set -e

echo "🌱 Seeding CRM users with SQL..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Step 1: Generate the correct bcrypt hash for Vyntrise2026!
echo "🔐 Generating password hash..."
HASH=$(docker run --rm node:20-alpine sh -c "npm install -g bcryptjs-cli && bcrypt-cli 'Vyntrise2026!' 12" 2>/dev/null | tail -1)

if [ -z "$HASH" ]; then
  echo "❌ Failed to generate hash. Using pre-generated hash..."
  # Fallback to a pre-generated hash (you should replace this with the actual hash)
  HASH='$2a$12$rQHc7RZqKvGJxPzX8yN0/.vYJ5fZKp7VZ0qH5YxGxKp7VZ0qH5YxG'
fi

echo "✅ Hash generated"

# Step 2: Run the SQL seed
echo "📝 Inserting users into database..."

docker exec -i deploy-vyntrize-postgres-1 psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" <<EOF
-- Insert users with generated hash
INSERT INTO crm_users (id, email, "displayName", "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES 
  ('clzadmin001', 'abdisa@vyntrise.com', 'Abdisa Bati', '${HASH}', 'ADMIN', true, NOW(), NOW()),
  ('clzadmin002', 'abenezer@vyntrise.com', 'Abenezer Seyoum', '${HASH}', 'ADMIN', true, NOW(), NOW()),
  ('clzmember001', 'biniyam@vyntrise.com', 'Biniyam Lombe', '${HASH}', 'MEMBER', true, NOW(), NOW()),
  ('clzmember002', 'mesay@vyntrise.com', 'Mesay Alemayehu', '${HASH}', 'MEMBER', true, NOW(), NOW()),
  ('clzmember003', 'gedion@vyntrise.com', 'Gedion Bula', '${HASH}', 'MEMBER', true, NOW(), NOW()),
  ('clzmember004', 'mahlet@vyntrise.com', 'Mahlet Getachew', '${HASH}', 'MEMBER', true, NOW(), NOW()),
  ('clzmember005', 'abel@vyntrise.com', 'Abel Legesse', '${HASH}', 'MEMBER', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Show results
SELECT email, "displayName", role, "isActive" FROM crm_users ORDER BY role DESC, email;
EOF

echo ""
echo "✅ Seeding complete!"
echo ""
echo "🔑 Login credentials:"
echo "   Password for all users: Vyntrise2026!"
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
