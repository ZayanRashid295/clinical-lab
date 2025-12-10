# Fix: /api/docs Opens Frontend Instead of Backend

## Problem

When accessing `https://uworld-zayan.org/api/docs`, the frontend Next.js app catches the route instead of proxying it to the backend API.

## Root Cause

Nginx is configured to proxy all routes (`location /`) to the Next.js frontend, which then catches all routes including `/api/*`.

## Solution

Update your frontend Nginx configuration to proxy `/api/*` routes to the backend **before** passing other routes to Next.js.

## Updated Nginx Configuration

Edit `/etc/nginx/sites-available/clinical-lab-frontend`:

```nginx
server {
    listen 80;
    server_name uworld-zayan.org www.uworld-zayan.org;

    # Redirect HTTP to HTTPS (after SSL)
    # return 301 https://$server_name$request_uri;

    # IMPORTANT: Proxy API routes to backend FIRST (before Next.js)
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

## Apply the Fix

```bash
# Edit the config file
sudo nano /etc/nginx/sites-available/clinical-lab-frontend

# Test the configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## Update Environment Variables

Since you're now using `/api` on the same domain, update your frontend `.env.local`:

```bash
cd ~/deployments/clinical-lab/frontend-next
cat >> .env.local << EOF
NEXT_PUBLIC_API_URL=https://uworld-zayan.org/api
NODE_ENV=production
EOF

# Restart frontend
pm2 restart clinical-lab-frontend
```

## Verification

After applying the fix:

1. **API Docs should work**: `https://uworld-zayan.org/api/docs`
2. **Backend API accessible**: `https://uworld-zayan.org/api/questions`
3. **Frontend still works**: `https://uworld-zayan.org`

## Alternative: Use Subdomain

If you prefer to keep frontend and backend completely separate:

1. **Keep current Nginx config** (no `/api/` location)
2. **Use subdomain for API**: `https://api.uworld-zayan.org/api/docs`
3. **Update frontend `.env.local`**:
   ```bash
   NEXT_PUBLIC_API_URL=https://api.uworld-zayan.org
   ```

## How Nginx Location Matching Works

Nginx matches locations in this order:
1. **Exact matches** (`=`)
2. **Prefix matches** (longest first)
3. **Regex matches**
4. **General matches** (`/`)

By putting `/api/` before `/`, Nginx will match API routes first and proxy them to the backend.

## Troubleshooting

### Still seeing frontend for /api/docs?

1. **Check Nginx config order**: `/api/` must come before `/`
2. **Check backend is running**: `pm2 status clinical-lab-backend`
3. **Check backend port**: Backend should be on port 3001
4. **Check Nginx error logs**: `sudo tail -f /var/log/nginx/error.log`
5. **Test backend directly**: `curl http://localhost:3001/api/docs`

### Backend returns 404?

1. **Check backend route**: Backend serves docs at `/api/docs` (from `main.ts`)
2. **Check proxy_pass**: Should be `http://localhost:3001/` (note the trailing slash)
3. **Check backend logs**: `pm2 logs clinical-lab-backend`







