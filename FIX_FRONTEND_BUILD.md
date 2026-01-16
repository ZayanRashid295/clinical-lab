# Fix Frontend Build Error

## Error
```
Error: Could not find a production build in the '.next' directory. 
Try building your app with 'next build' before starting the production server.
```

## Solution

The frontend needs to be built before PM2 can start it in production mode.

### Quick Fix

Run these commands on your server:

```bash
cd ~/deployments/clinical-lab/frontend-next

# Build the frontend
npm run build

# Restart PM2
cd ..
pm2 restart clinical-lab-frontend

# Check status
pm2 status
pm2 logs clinical-lab-frontend --lines 20
```

### Complete Fix (if dependencies are missing)

```bash
cd ~/deployments/clinical-lab/frontend-next

# Install dependencies (if needed)
npm install

# Build the frontend
npm run build

# Verify .next directory exists
ls -la .next

# Restart PM2
cd ..
pm2 restart clinical-lab-frontend

# Check logs
pm2 logs clinical-lab-frontend --lines 30
```

### If Build Fails

If `npm run build` fails, check for errors:

```bash
cd ~/deployments/clinical-lab/frontend-next

# Check for TypeScript errors
npm run build 2>&1 | tee build.log

# Review errors
cat build.log
```

Common issues:
1. **Missing dependencies**: Run `npm install`
2. **TypeScript errors**: Fix or ignore (check tsconfig.json)
3. **Environment variables**: Ensure `.env.local` exists if needed

### Verify Build Success

After building, you should see:
- `.next` directory created
- `BUILD_ID` file in `.next` directory
- No errors in build output

```bash
cd ~/deployments/clinical-lab/frontend-next
ls -la .next/
cat .next/BUILD_ID
```

### PM2 Configuration Check

Make sure PM2 is configured to run `npm start` (not `npm run dev`):

```bash
pm2 show clinical-lab-frontend
# Should show: script: npm start or next start
```

If PM2 is running `npm run dev`, update it:
```bash
cd ~/deployments/clinical-lab/frontend-next
pm2 delete clinical-lab-frontend
pm2 start npm --name "clinical-lab-frontend" -- start
pm2 save
```


