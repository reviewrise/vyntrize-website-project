# Database Initialization Error - Fix Guide

## ❌ Error

```
Error: Database is uninitialized and superuser password is not specified.
```

## 🔍 Root Cause

The PostgreSQL container requires `POSTGRES_PASSWORD` to be set, but it's missing from your environment configuration.

## ✅ Solution

### Option 1: Quick Fix (Development)

If you're running the database locally for development:

1. **Check if PostgreSQL is running**:
   ```bash
   # Check if postgres is running
   docker ps | grep postgres
   # OR
   pg_isready -h localhost -p 5432
   ```

2. **If using Docker, stop and remove the container**:
   ```bash
   docker-compose down -v
   # This removes volumes, which will reset the database
   ```

3. **Ensure your `.env` file has the password**:
   ```env
   POSTGRES_PASSWORD=vyntrize_password
   ```

4. **Restart the database**:
   ```bash
   docker-compose up -d vyntrize-postgres
   ```

### Option 2: Production Deployment Fix

If you're deploying to production:

1. **Create/Update `deploy/.env` file**:
   ```bash
   cd deploy
   cp .env.example .env
   ```

2. **Edit `deploy/.env` and set a secure password**:
   ```env
   POSTGRES_USER=vyntrize_user
   POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE
   POSTGRES_DB=vyntrize_db
   
   VYNTRIZE_DATABASE_URL=postgresql://vyntrize_user:YOUR_SECURE_PASSWORD_HERE@vyntrize-postgres:5432/vyntrize_db
   CRM_DATABASE_URL=postgresql://vyntrize_user:YOUR_SECURE_PASSWORD_HERE@vyntrize-postgres:5432/vyntrize_db
   ```

3. **Generate a secure password**:
   ```bash
   # Generate a random password
   openssl rand -base64 32
   ```

4. **Remove old database volume** (if exists):
   ```bash
   docker-compose down -v
   ```

5. **Start services**:
   ```bash
   docker-compose up -d
   ```

### Option 3: Local Development (No Docker)

If you're running PostgreSQL locally without Docker:

1. **Check your local `.env` file** (root directory):
   ```env
   VYNTRIZE_DATABASE_URL="postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db?sslmode=disable"
   CRM_DATABASE_URL="postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db?sslmode=disable"
   POSTGRES_SUPERUSER_URL="postgresql://postgres:password@localhost:5432/postgres"
   ```

2. **Ensure PostgreSQL is running**:
   ```bash
   # On Windows (if installed as service)
   net start postgresql-x64-16
   
   # On Mac
   brew services start postgresql@16
   
   # On Linux
   sudo systemctl start postgresql
   ```

3. **Create the database and user** (if not exists):
   ```bash
   # Connect as superuser
   psql -U postgres
   
   # In psql:
   CREATE USER vyntrize_user WITH PASSWORD 'vyntrize_password';
   CREATE DATABASE vyntrize_db OWNER vyntrize_user;
   GRANT ALL PRIVILEGES ON DATABASE vyntrize_db TO vyntrize_user;
   \q
   ```

## 🔧 Verification Steps

After applying the fix:

1. **Test database connection**:
   ```bash
   # Using psql
   psql "postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db"
   
   # Using Prisma
   cd packages/@platform/vyntrize-db
   npx prisma db pull
   ```

2. **Check if database is accessible**:
   ```bash
   # Should show tables
   npx prisma studio
   ```

3. **Run migrations** (if needed):
   ```bash
   cd packages/@platform/vyntrize-db
   npx prisma db push
   ```

## 📋 Checklist

- [ ] `POSTGRES_PASSWORD` is set in `.env` file
- [ ] Database connection string includes the password
- [ ] PostgreSQL service is running
- [ ] Database and user exist
- [ ] Can connect to database with provided credentials
- [ ] Prisma can connect to database
- [ ] Applications can start without errors

## 🚨 Common Issues

### Issue 1: Password Mismatch
**Symptom**: "password authentication failed"  
**Fix**: Ensure password in `.env` matches the one used to create the database

### Issue 2: Database Doesn't Exist
**Symptom**: "database does not exist"  
**Fix**: Create the database:
```bash
createdb -U postgres vyntrize_db
```

### Issue 3: User Doesn't Exist
**Symptom**: "role does not exist"  
**Fix**: Create the user:
```bash
psql -U postgres -c "CREATE USER vyntrize_user WITH PASSWORD 'vyntrize_password';"
```

### Issue 4: Permission Denied
**Symptom**: "permission denied for database"  
**Fix**: Grant permissions:
```bash
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE vyntrize_db TO vyntrize_user;"
```

### Issue 5: Port Already in Use
**Symptom**: "port 5432 is already allocated"  
**Fix**: Stop other PostgreSQL instances or change the port

## 🔐 Security Best Practices

### For Development
- Use simple passwords like `vyntrize_password`
- Keep credentials in `.env` (gitignored)
- Don't commit `.env` files

### For Production
- Use strong, random passwords (32+ characters)
- Use environment variables or secrets management
- Enable SSL/TLS for database connections
- Restrict database access by IP
- Regular backups
- Monitor access logs

### Generate Secure Password
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 📝 Environment File Template

### Development (`.env` in root)
```env
# Database
VYNTRIZE_DATABASE_URL="postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db?sslmode=disable"
CRM_DATABASE_URL="postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db?sslmode=disable"
POSTGRES_SUPERUSER_URL="postgresql://postgres:password@localhost:5432/postgres"

# Session
SESSION_SECRET="your-super-secret-session-key-min-32-chars-here"

# Seed
SEED_ADMIN_EMAIL="admin@vyntrise.com"
SEED_ADMIN_PASSWORD="ChangeMe123!"
SEED_ADMIN_NAME="Admin User"
SEED_DEFAULT_PASSWORD="Vyntrise2026!"

# Runtime
NODE_ENV="development"
```

### Production (`deploy/.env`)
```env
# PostgreSQL
POSTGRES_USER=vyntrize_user
POSTGRES_PASSWORD=<GENERATE_SECURE_PASSWORD>
POSTGRES_DB=vyntrize_db

# Database URLs
VYNTRIZE_DATABASE_URL=postgresql://vyntrize_user:<PASSWORD>@vyntrize-postgres:5432/vyntrize_db
CRM_DATABASE_URL=postgresql://vyntrize_user:<PASSWORD>@vyntrize-postgres:5432/vyntrize_db

# Session
SESSION_SECRET=<GENERATE_SECURE_SECRET>

# Environment
NODE_ENV=production
```

## 🎯 Quick Commands

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs vyntrize-postgres

# Connect to database
psql "postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db"

# Test connection with Prisma
cd packages/@platform/vyntrize-db && npx prisma db pull

# Restart database container
docker-compose restart vyntrize-postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v && docker-compose up -d
```

## ✅ Resolution

Once you've set the `POSTGRES_PASSWORD` and restarted the database:

1. Database should initialize successfully
2. Applications should connect without errors
3. You can run migrations and seeds
4. Email templates can be seeded
5. CRM and website should work normally

---

**Status**: Awaiting user action  
**Priority**: High (blocks development)  
**Estimated Time**: 5-10 minutes
