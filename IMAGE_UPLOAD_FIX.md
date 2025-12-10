# Image Upload and Display Fix Guide

## Problem
Images are not showing in questions. You see placeholder icons or "Failed to upload image" errors.

## Root Causes

1. **Backend API_URL**: Backend uses `localhost:3000` for image URLs in production
2. **Frontend API URL**: Frontend may not be configured with correct production API URL
3. **Database URLs**: Existing questions have `localhost` URLs that don't work in production
4. **Nginx Configuration**: Static files may not be properly served

## Solutions

### 1. Set Environment Variables

**On Production Server - Backend `.env`:**

```bash
# Backend .env
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
PORT=3001
```

**On Production Server - Frontend `.env.local`:**

```bash
# Frontend .env.local
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 2. Update Nginx Configuration

Ensure Nginx serves static uploads from the backend. Update your backend Nginx config:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        # ... other proxy settings
    }

    # Serve static uploads directly
    location /uploads/ {
        alias /var/www/clinical-lab/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Allow CORS for images
        add_header Access-Control-Allow-Origin *;
    }
}
```

### 3. Fix Existing Image URLs in Database

Run the fix script to update all `localhost` URLs to production URLs:

```bash
cd ~/deployments/clinical-lab/backend

# Set the old and new URLs
export OLD_API_URL="http://localhost:3000"
export API_URL="https://api.yourdomain.com"

# Run the fix script
npx tsx fix-image-urls.ts
```

### 4. Verify Upload Directory Exists

```bash
cd ~/deployments/clinical-lab/backend
mkdir -p public/uploads
chmod -R 755 public/uploads
```

### 5. Restart Services

```bash
# Restart backend
pm2 restart clinical-lab-backend

# Restart frontend
pm2 restart clinical-lab-frontend

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Test Image Upload

1. Log into your application
2. Go to question generator
3. Try uploading an image
4. Check browser console for errors
5. Check backend logs: `pm2 logs clinical-lab-backend`

## Troubleshooting

### Images Still Not Showing

1. **Check image URLs in database:**
   ```bash
   # Use Prisma Studio
   npm run prisma:studio
   # Check questionStemBlocks, explanationBlocks for image URLs
   ```

2. **Check file permissions:**
   ```bash
   ls -la public/uploads/
   # Should show readable files
   ```

3. **Check Nginx access logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   # Try accessing an image URL directly
   ```

4. **Check CORS:**
   - Images should be accessible from frontend domain
   - Check browser console for CORS errors

### Upload Fails

1. **Check authentication:**
   - Image upload requires JWT token
   - Check if user is logged in
   - Check token in localStorage

2. **Check file size:**
   - Max size is 5MB
   - Check backend logs for size errors

3. **Check file type:**
   - Allowed: jpeg, jpg, png, gif, webp
   - Check backend logs for type errors

4. **Check backend logs:**
   ```bash
   pm2 logs clinical-lab-backend --lines 50
   ```

## Quick Fix Commands

```bash
# 1. Set environment variables
cd ~/deployments/clinical-lab/backend
echo "API_URL=https://api.yourdomain.com" >> .env
echo "FRONTEND_URL=https://yourdomain.com" >> .env

cd ~/deployments/clinical-lab/frontend-next
echo "NEXT_PUBLIC_API_URL=https://api.yourdomain.com" >> .env.local

# 2. Fix database URLs
cd ~/deployments/clinical-lab/backend
export OLD_API_URL="http://localhost:3000"
export API_URL="https://api.yourdomain.com"
npx tsx fix-image-urls.ts

# 3. Restart services
pm2 restart all
sudo systemctl reload nginx
```

## Verification

After fixes, verify:

1. **Upload works:** Try uploading a new image
2. **Existing images show:** Check questions with existing images
3. **URLs are correct:** Check database for correct URLs
4. **Files exist:** Check `public/uploads/` directory
5. **Nginx serves files:** Access image URL directly in browser







