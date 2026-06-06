# Fix: Image upload 413 on production (`Failed to upload image: 413`)

## Important

**Do not replace your whole nginx file** with the repo copy. Certbot manages SSL (`listen 443`, certificate paths, `options-ssl-nginx.conf`) on the server. Those paths may not exist until certbot has run, or may live in a different include file.

Only add `client_max_body_size 50m;` to your **existing** working config.

## Why it works locally but not deployed

Locally, the frontend calls the Nest backend **directly** (e.g. `http://localhost:43817/questions/upload-image`).

In production, uploads go through nginx:

`https://uworld-zayan.org/api/questions/upload-image` → nginx → Nest on port 3000

Nginx’s **default** `client_max_body_size` is **1MB**. Embedded DOCX/markdown images are often larger than that, so nginx returns **413 Request Entity Too Large** before Nest ever sees the file.

## Root cause (updated)

Two common causes of **413** on `POST /api/questions/upload-image`:

1. **nginx `client_max_body_size`** default 1MB (fixed with `50m` / `200m`)
2. **Next.js Pages API default body limit is 1MB** — if the upload hits Next instead of Nest, or after switching to the upload proxy below

## Fix: route uploads through Next.js (streams to Nest)

Add this block **before** `location /api/` in `/etc/nginx/conf.d/zayan.conf`:

```nginx
location = /api/questions/upload-image {
    client_max_body_size 200m;
    proxy_pass http://127.0.0.1:3001/api/questions/upload-image;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;
    proxy_request_buffering off;
    proxy_read_timeout 300s;
}
```

Then deploy frontend (includes `pages/api/questions/upload-image.ts` proxy):

```bash
cd ~/deployments/clinical-lab/clinical-lab
git pull
cd frontend-next
yarn build
pm2 restart clinical-lab-frontend
```

# Optional in frontend-next/.env.local (server-side only — not exposed to browser):
BACKEND_INTERNAL_URL=http://127.0.0.1:3000

Reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 2. Optional global fallback (recommended)

In `/etc/nginx/nginx.conf`, inside the `http { }` block:

```nginx
http {
    client_max_body_size 50m;
    # ...
}
```

### Reload nginx

```bash
sudo nginx -t
sudo systemctl start nginx    # use start if nginx was stopped after a failed test
# or: sudo systemctl reload nginx
```

If `nginx -t` fails on missing `/etc/letsencrypt/options-ssl-nginx.conf`, you copied SSL lines from the repo that do not belong on your server. Remove lines like:

```nginx
include /etc/letsencrypt/options-ssl-nginx.conf;
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
```

…unless Certbot actually created those files (`ls /etc/letsencrypt/`). Restore your previous config from backup if needed:

```bash
sudo cp /etc/nginx/conf.d/zayan.conf.bak /etc/nginx/conf.d/zayan.conf
```

### 4. Verify the active config (check HTTPS block specifically)

```bash
nginx -T 2>/dev/null | grep -B5 client_max_body_size
```

You should see `50m` on the server block that has **`listen 443 ssl`** (not just port 80).

Common mistake: `client_max_body_size` added only to a port-80 block while HTTPS traffic uses a different block added by Certbot without the limit.

### 5. Backend env (already supported)

In `backend/.env` on the server:

```env
BODY_PARSER_LIMIT=50mb
```

Restart backend after changing:

```bash
pm2 restart clinical-lab-backend
```

Nest also rejects individual images **over 5MB** with HTTP 400 (not 413). If you still see 413 after nginx is fixed, the request is still being blocked upstream of Nest.

## Quick test from the server

```bash
# Replace TOKEN and path/to/image.png
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST "https://uworld-zayan.org/api/questions/upload-image" \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@/path/to/image.png"
```

- **413** → nginx (or another proxy) body limit still too low  
- **401** → auth (expected without valid token)  
- **201** → upload OK  

## Duplicate warnings for the same filename

Bulk upload runs one upload **per question file**. Four questions each embedding `image_0.png` produces four separate upload attempts and four warnings if all fail — that is expected, not four retries of one upload.
