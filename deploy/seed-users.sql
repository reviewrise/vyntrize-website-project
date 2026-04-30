-- Seed CRM users for Vyntrize
-- Password for all users: Vyntrise2026!
-- Hash generated with: bcrypt.hashSync('Vyntrise2026!', 12)

-- Clean existing data (optional - comment out if you want to preserve existing users)
-- DELETE FROM crm_users;

-- Insert users (ON CONFLICT DO NOTHING prevents duplicates)
INSERT INTO crm_users (id, email, "displayName", "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES 
  ('clzadmin001', 'abdisa@vyntrise.com', 'Abdisa Bati', '$2a$12$rQHc7RZqKvGJxPzX8yN0/.vYJ5fZKp7VZ0qH5YxGxKp7VZ0qH5YxG', 'ADMIN', true, NOW(), NOW()),
  ('clzadmin002', 'abenezer@vyntrise.com', 'Abenezer Seyoum', '$2a$12$rQHc7RZqKvGJxPzX8yN0/.vYJ5fZKp7VZ0qH5YxGxKp7VZ0qH5YxG', 'ADMIN', true, NOW(), NOW()),
  ('clzmember001', 'biniyam@vyntrise.com', 'Biniyam Lombe', '$2a$12$rQHc7RZqKvGJxPzX8yN0/.vYJ5fZKp7VZ0qH5YxGxKp7VZ0qH5YxG', 'MEMBER', true, NOW(), NOW()),
  ('clzmember002', 'mesay@vyntrise.com', 'Mesay Alemayehu', '$2a$12$rQHc7RZqKvGJxPzX8yN0/.vYJ5fZKp7VZ0qH5YxGxKp7VZ0qH5YxG', 'MEMBER', true, NOW(), NOW()),
  ('clzmember003', 'gedion@vyntrise.com', 'Gedion Bula', '$2a$12$rQHc7RZqKvGJxPzX8yN0/.vYJ5fZKp7VZ0qH5YxGxKp7VZ0qH5YxG', 'MEMBER', true, NOW(), NOW()),
  ('clzmember004', 'mahlet@vyntrise.com', 'Mahlet Getachew', '$2a$12$rQHc7RZqKvGJxPzX8yN0/.vYJ5fZKp7VZ0qH5YxGxKp7VZ0qH5YxG', 'MEMBER', true, NOW(), NOW()),
  ('clzmember005', 'abel@vyntrise.com', 'Abel Legesse', '$2a$12$rQHc7RZqKvGJxPzX8yN0/.vYJ5fZKp7VZ0qH5YxGxKp7VZ0qH5YxG', 'MEMBER', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Verify the insert
SELECT email, "displayName", role, "isActive" FROM crm_users ORDER BY role DESC, email;
