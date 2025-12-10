#!/bin/bash

# Deployment script to sync modified files to production server
# Usage: ./deploy-to-production.sh [production-server-ip]

PROD_SERVER="${1:-ubuntu@3.26.151.118}"
PROD_PATH="~/deployments/clinical-lab"

echo "🚀 Starting deployment to production..."
echo "📦 Target: $PROD_SERVER:$PROD_PATH"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run command and show status
run_cmd() {
    echo -e "${YELLOW}▶ $1${NC}"
    eval $1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Success${NC}\n"
    else
        echo -e "❌ Failed\n"
        exit 1
    fi
}

# 1. Build Backend
echo "📦 Step 1: Building Backend..."
cd backend
run_cmd "npm run build"

# 2. Build Frontend
echo "📦 Step 2: Building Frontend..."
cd ../frontend-next
run_cmd "npm run build"

cd ..

# 3. Sync Backend Files
echo "📤 Step 3: Syncing Backend Files..."
run_cmd "rsync -avz --exclude 'node_modules' --exclude '.git' \
    backend/ $PROD_SERVER:$PROD_PATH/backend/"

# 4. Sync Frontend Files
echo "📤 Step 4: Syncing Frontend Files..."
run_cmd "rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
    frontend-next/ $PROD_SERVER:$PROD_PATH/frontend-next/"

# 5. Sync Documentation Files
echo "📤 Step 5: Syncing Documentation..."
run_cmd "scp PRODUCTION_ENV_SETUP.md NGINX_API_ROUTING_FIX.md IMAGE_UPLOAD_FIX.md \
    $PROD_SERVER:$PROD_PATH/"

echo ""
echo "✅ Files synced successfully!"
echo ""
echo "📋 Next steps on production server:"
echo "   1. SSH into production: ssh $PROD_SERVER"
echo "   2. Install dependencies:"
echo "      cd $PROD_PATH/backend && npm install"
echo "      cd $PROD_PATH/frontend-next && npm install"
echo "   3. Restart services:"
echo "      pm2 restart clinical-lab-backend"
echo "      pm2 restart clinical-lab-frontend"
echo "   4. Check status: pm2 status"

