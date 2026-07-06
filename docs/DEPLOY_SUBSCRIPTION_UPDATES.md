# Deploy Subscription Updates - Complete Checklist

## Issue
Server is not showing latest subscription-related features after pulling code.

## Database Setup
**Note:** Your database is accessed via phpMyAdmin (MySQL). Prisma CLI commands will still work as long as `DATABASE_URL` is correctly set in the backend `.env` file.

## Solution: Complete Deployment Steps

Run these commands **in order** on your production server:

### Step 1: Resolve Git Conflicts and Pull Latest Code

```bash
cd ~/deployments/clinical-lab

# Stash any local changes
git stash

# Pull latest code
git pull origin ahmad/uworld-ver-2

# If there are still conflicts, check the file
git status
```

### Step 2: Update Backend

```bash
cd ~/deployments/clinical-lab/backend

# IMPORTANT: Ensure .env file has correct DATABASE_URL
# Format: DATABASE_URL="mysql://username:password@localhost:3306/database_name"
# Check if .env exists and has correct database connection
cat .env | grep DATABASE_URL

# Install any new dependencies
npm install

# Generate Prisma client (important for subscription schema changes)
npm run prisma:generate

# Apply database migrations (for subscription tables/features)
# This will connect to your MySQL database and apply migrations
npx prisma migrate deploy

# Rebuild backend
npm run build
```

**Alternative: If Prisma migrate doesn't work, you can:**
1. Use `prisma db push` instead (pushes schema directly without migration history):
   ```bash
   npm run prisma:push
   ```
2. Or manually run SQL through phpMyAdmin (see "Manual Migration via phpMyAdmin" section below)

### Step 3: Update Frontend

```bash
cd ~/deployments/clinical-lab/frontend-next

# Install any new dependencies
npm install

# Rebuild frontend
npm run build
```

### Step 4: Restart Services

```bash
cd ~/deployments/clinical-lab

# Restart both services
pm2 restart clinical-lab-backend
pm2 restart clinical-lab-frontend

# Check status
pm2 status

# Check logs for errors
pm2 logs clinical-lab-backend --lines 50
pm2 logs clinical-lab-frontend --lines 50
```

### Step 5: Verify Database Schema

**Option 1: Via phpMyAdmin**
1. Log into phpMyAdmin
2. Select your database
3. Check for these tables:
   - `subscription_packages`
   - `package_features`
   - `subscription_features`
   - `subscriptions`
4. Run this SQL to verify:
   ```sql
   SHOW TABLES LIKE '%subscription%';
   SHOW TABLES LIKE '%package%';
   ```

**Option 2: Via Prisma Studio**
```bash
cd ~/deployments/clinical-lab/backend
npx prisma studio
# Opens at http://localhost:5555
```

**Option 3: Via MySQL Command Line**
```bash
mysql -u username -p database_name -e "SHOW TABLES LIKE '%subscription%';"
```

### Step 6: Seed Subscription Data (if needed)

If subscription packages/features are missing:

```bash
cd ~/deployments/clinical-lab/backend

# Run seed to populate subscription packages and features
npm run prisma:seed
```

## Quick All-in-One Command

```bash
cd ~/deployments/clinical-lab && \
git stash && git pull origin ahmad/uworld-ver-2 && \
cd backend && npm install && npm run prisma:generate && npx prisma migrate deploy && npm run build && \
cd ../frontend-next && npm install && npm run build && \
cd .. && pm2 restart clinical-lab-backend clinical-lab-frontend && \
pm2 status
```

## What Changed in Latest Subscription Updates

Based on commit `adbe46a6`:
- ✅ Subscription guards and decorators for access control
- ✅ Feature-based access control (Qbank Access, Self Assessment, etc.)
- ✅ Subscription status checks
- ✅ Combined access guard for complex requirements
- ✅ Frontend access control hooks
- ✅ Subscription cleanup functionality
- ✅ Enhanced UI feedback for subscription status

## Manual Migration via phpMyAdmin (Alternative Method)

If Prisma CLI commands don't work, you can apply migrations manually:

1. **Check migration files:**
   ```bash
   cd ~/deployments/clinical-lab/backend/prisma/migrations
   ls -la
   ```

2. **Open migration SQL files:**
   - `20251031164433_init/migration.sql` - Main schema
   - `add_access_control_indexes.sql` - Indexes for access control

3. **In phpMyAdmin:**
   - Select your database
   - Go to "SQL" tab
   - Copy and paste the SQL from migration files
   - Execute

4. **Verify tables were created:**
   ```sql
   SHOW TABLES;
   ```

## Troubleshooting

### If DATABASE_URL is incorrect:
```bash
cd ~/deployments/clinical-lab/backend
# Edit .env file
nano .env
# Update DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

### If backend fails to start:
```bash
pm2 logs clinical-lab-backend --lines 100
# Check for Prisma errors, missing migrations, or schema issues
```

### If frontend fails to start:
```bash
pm2 logs clinical-lab-frontend --lines 100
# Check for build errors or missing dependencies
```

### If subscription features still not showing:
1. **Verify database has subscription tables via phpMyAdmin:**
   - Log into phpMyAdmin
   - Select your database
   - Check if these tables exist:
     - `subscription_packages`
     - `package_features`
     - `subscription_features`
     - `subscriptions`
   - If missing, run migrations (see "Manual Migration via phpMyAdmin" above)

2. **Verify seed data exists:**
   ```bash
   cd ~/deployments/clinical-lab/backend
   npm run prisma:seed
   ```
   Or check via phpMyAdmin:
   ```sql
   SELECT COUNT(*) FROM subscription_packages;
   SELECT COUNT(*) FROM package_features;
   ```

3. **Check API endpoints are working:**
   ```bash
   curl http://localhost:3000/api/subscriptions/packages
   # Or test from browser: http://your-domain/api/subscriptions/packages
   ```

4. **Check Prisma can connect to database:**
   ```bash
   cd ~/deployments/clinical-lab/backend
   npx prisma db pull
   # This should show your current database schema
   ```

### Clear PM2 logs if needed:
```bash
pm2 flush
```

## Verification Checklist

After deployment, verify:
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Database has subscription tables
- [ ] Subscription packages are seeded
- [ ] API endpoint `/api/subscriptions/packages` returns data
- [ ] Frontend can access subscription features
- [ ] Access control guards are working

