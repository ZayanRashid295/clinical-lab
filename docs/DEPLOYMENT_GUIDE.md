# Deployment Guide - Sync Modified Files to Production

## Quick Deployment Commands

### Option 1: Using rsync (Recommended - Fast & Efficient)

```bash
# From your local machine
cd /mnt/newvolume/project_fyp/sir/clinical-lab

# 1. Build Backend
cd backend
npm run build
cd ..

# 2. Build Frontend
cd frontend-next
npm run build
cd ..

# 3. Sync Backend (excludes node_modules, .git)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
    backend/ ubuntu@3.26.151.118:~/deployments/clinical-lab/backend/

# 4. Sync Frontend (excludes node_modules, .next, .git)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
    frontend-next/ ubuntu@3.26.151.118:~/deployments/clinical-lab/frontend-next/

# 5. Sync documentation
scp docs/PRODUCTION_ENV_SETUP.md ubuntu@3.26.151.118:~/deployments/clinical-lab/docs/
```

### Option 2: Using SCP (File by File)

```bash
# Backend modified files
scp backend/prisma/seed.ts ubuntu@3.26.151.118:~/deployments/clinical-lab/backend/prisma/
scp backend/prisma/seed-questions.ts ubuntu@3.26.151.118:~/deployments/clinical-lab/backend/prisma/
scp backend/src/modules/questions/questions.service.ts ubuntu@3.26.151.118:~/deployments/clinical-lab/backend/src/modules/questions/

# Frontend modified files (example — sync the paths you changed)
scp frontend-next/src/app/components/question-generator/*.tsx \
    ubuntu@3.26.151.118:~/deployments/clinical-lab/frontend-next/src/app/components/question-generator/
```

### Option 3: Using Git (If using version control)

```bash
# On production server
ssh ubuntu@3.26.151.118
cd ~/deployments/clinical-lab
git pull origin main  # or your branch name

# Then rebuild and restart
cd backend && npm install && npm run build
cd ../frontend-next && npm install && npm run build
pm2 restart all
```

## Complete Deployment Steps

### On Your Local Machine:

```bash
cd /mnt/newvolume/project_fyp/sir/clinical-lab

# 1. Build Backend
cd backend
npm run build
cd ..

# 2. Build Frontend  
cd frontend-next
npm run build
cd ..

# 3. Deploy using rsync
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'dist' \
    --exclude '*.log' \
    backend/ ubuntu@3.26.151.118:~/deployments/clinical-lab/backend/

rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'dist' \
    --exclude '*.log' \
    frontend-next/ ubuntu@3.26.151.118:~/deployments/clinical-lab/frontend-next/
```

### On Production Server:

```bash
ssh ubuntu@3.26.151.118

# 1. Navigate to project
cd ~/deployments/clinical-lab

# 2. Install/Update Backend Dependencies
cd backend
npm install --production
npm run prisma:generate
npx prisma migrate deploy
npm run build
cd ..

# 3. Install/Update Frontend Dependencies
cd frontend-next
npm install --production
npm run build
cd ..

# 4. Restart Services
pm2 restart clinical-lab-backend
pm2 restart clinical-lab-frontend

# 5. Check Status
pm2 status
pm2 logs clinical-lab-backend --lines 20
pm2 logs clinical-lab-frontend --lines 20
```

## Deploy checklist

1. Pull or rsync latest `backend/` and `frontend-next/`
2. `npm install` in both apps
3. `npx prisma migrate deploy` in `backend/`
4. Build both apps
5. `pm2 restart` backend and frontend services

See also [DEPLOY_SUBSCRIPTION_UPDATES.md](./DEPLOY_SUBSCRIPTION_UPDATES.md) for database migration notes.

## Quick One-Liner Deployment

```bash
# Build and deploy everything
cd /mnt/newvolume/project_fyp/sir/clinical-lab && \
cd backend && npm run build && cd .. && \
cd frontend-next && npm run build && cd .. && \
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' backend/ ubuntu@3.26.151.118:~/deployments/clinical-lab/backend/ && \
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' frontend-next/ ubuntu@3.26.151.118:~/deployments/clinical-lab/frontend-next/
```

## Verify Deployment

After deployment, verify on production:

```bash
ssh ubuntu@3.26.151.118

# Check if files were updated
cd ~/deployments/clinical-lab/backend
ls -la prisma/seed-questions.ts
ls -la src/modules/questions/questions.service.ts

# Check if services are running
pm2 status

# Check logs for errors
pm2 logs clinical-lab-backend --lines 30
pm2 logs clinical-lab-frontend --lines 30
```

