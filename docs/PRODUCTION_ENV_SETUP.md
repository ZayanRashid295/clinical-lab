# Production Environment Setup for uworld-zayan.org

## Domain Configuration

- **Frontend**: `https://uworld-zayan.org`
- **Backend API**: `https://api.uworld-zayan.org` (or `https://uworld-zayan.org/api` if using same domain)

## Environment Variables

### Backend `.env` (Production Server)

```bash
# Database
DATABASE_URL="mysql://username:password@localhost:3306/uworld-db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Application
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://uworld-zayan.org"

# API URL for image uploads (use full URL)
API_URL="https://api.uworld-zayan.org"

# CORS - Update for production
CORS_ORIGIN="https://uworld-zayan.org"
```

### Frontend `.env.local` (Production Server)

**Option 1: If backend is on separate subdomain:**
```bash
NEXT_PUBLIC_API_URL=https://api.uworld-zayan.org
NODE_ENV=production
```

**Option 2: If backend is on same domain with /api prefix:**
```bash
NEXT_PUBLIC_API_URL=https://uworld-zayan.org/api
NODE_ENV=production
```

**Option 3: If using relative paths (like development):**
```bash
# This only works if you have Next.js API routes proxying to backend
NEXT_PUBLIC_API_URL=/api
NODE_ENV=production
```

## Important Notes

### Development vs Production

**Development:**
- `NEXT_PUBLIC_API_URL=/auth` - Relative path (works with Next.js proxy)

**Production:**
- `NEXT_PUBLIC_API_URL=https://api.uworld-zayan.org` - Full URL (required for image uploads)

### Why Full URL is Required for Images

The image upload service constructs URLs like this:
```typescript
const url = `${API_BASE_URL}${this.endpoint}/upload-image`;
```

If `NEXT_PUBLIC_API_URL=/auth`, it becomes `/auth/questions/upload-image` which won't work in production.

## Setup Commands

### On Production Server

```bash
# Backend
cd ~/deployments/clinical-lab/backend
cat >> .env << EOF
API_URL=https://api.uworld-zayan.org
FRONTEND_URL=https://uworld-zayan.org
CORS_ORIGIN=https://uworld-zayan.org
EOF

# Frontend
cd ~/deployments/clinical-lab/frontend-next
cat >> .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.uworld-zayan.org
NODE_ENV=production
EOF

# Restart services
pm2 restart all
```

## Nginx Configuration

### Backend Nginx (`/etc/nginx/sites-available/clinical-lab-backend`)

```nginx
server {
    listen 80;
    server_name api.uworld-zayan.org;

    # Redirect HTTP to HTTPS (after SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve static uploads directly
    location /uploads/ {
        alias /var/www/clinical-lab/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
    }
}
```

### Frontend Nginx (`/etc/nginx/sites-available/clinical-lab-frontend`)

**Option 1: Proxy /api/* to backend (Recommended if using same domain)**

```nginx
server {
    listen 80;
    server_name uworld-zayan.org www.uworld-zayan.org;

    # Redirect HTTP to HTTPS (after SSL)
    # return 301 https://$server_name$request_uri;

    # Proxy API requests to backend BEFORE Next.js catches them
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy uploads to backend
    location /uploads/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # All other routes go to Next.js frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Option 2: Use subdomain only (Simpler, if you have subdomain setup)**

```nginx
server {
    listen 80;
    server_name uworld-zayan.org www.uworld-zayan.org;

    # Redirect HTTP to HTTPS (after SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Note:** With Option 2, use `https://api.uworld-zayan.org/api/docs` instead of `https://uworld-zayan.org/api/docs`

## SSL Setup

```bash
# Get SSL certificates for both domains
sudo certbot --nginx -d uworld-zayan.org -d www.uworld-zayan.org -d api.uworld-zayan.org
```

## Verification

After setup, verify:

1. **Frontend loads**: `https://uworld-zayan.org`
2. **Backend API works**: `https://api.uworld-zayan.org/api/docs`
3. **Image upload works**: Try uploading an image in question generator
4. **Existing images show**: Check questions with images
5. **CORS works**: Check browser console for CORS errors

## Troubleshooting

### Images Still Not Showing

1. Check environment variables are set correctly
2. Verify `API_URL` matches your production API domain
3. Check Nginx serves `/uploads/` correctly
4. Verify file permissions: `chmod -R 755 public/uploads`

### Upload Fails

1. Check `NEXT_PUBLIC_API_URL` is full URL (not relative)
2. Check authentication token exists
3. Check backend logs: `pm2 logs clinical-lab-backend`
4. Verify CORS allows frontend domain

