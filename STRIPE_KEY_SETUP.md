# Stripe Publishable Key Setup

## Your Stripe Key
```
pk_test_51SebsD2UvlnmUV8rLHcG5rLR23uu668uxPQ1Y6Io3OJJF1Svfh45oxlCNiLSrvLWi4xLTBFfYoobrP4wAiL673hs00uDEacnfb
```

## Commands to Run on Server

### Step 1: Update .env.local on Server

```bash
cd ~/deployments/clinical-lab/frontend-next

# Create or update .env.local with Stripe key
cat > .env.local << 'EOF'
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SebsD2UvlnmUV8rLHcG5rLR23uu668uxPQ1Y6Io3OJJF1Svfh45oxlCNiLSrvLWi4xLTBFfYoobrP4wAiL673hs00uDEacnfb
EOF

# Verify it was created
cat .env.local
```

### Step 2: Rebuild Frontend (IMPORTANT!)

**Note:** Next.js bakes `NEXT_PUBLIC_*` environment variables into the build at build time. You MUST rebuild after changing these variables.

```bash
cd ~/deployments/clinical-lab/frontend-next

# Rebuild to include the new env variable
npm run build

# Verify build succeeded
ls -la .next
```

### Step 3: Restart PM2

```bash
cd ~/deployments/clinical-lab
pm2 restart clinical-lab-frontend
pm2 logs clinical-lab-frontend --lines 20
```

## All-in-One Command

```bash
cd ~/deployments/clinical-lab/frontend-next && \
cat > .env.local << 'EOF'
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SebsD2UvlnmUV8rLHcG5rLR23uu668uxPQ1Y6Io3OJJF1Svfh45oxlCNiLSrvLWi4xLTBFfYoobrP4wAiL673hs00uDEacnfb
EOF
&& npm run build && cd .. && pm2 restart clinical-lab-frontend && pm2 status
```

## Why Rebuild is Required

Next.js environment variables prefixed with `NEXT_PUBLIC_*` are:
- Embedded into the JavaScript bundle at **build time**
- Not read at runtime
- Must be rebuilt when changed

This is different from server-side environment variables which can be changed without rebuilding.

## Verification

After rebuilding and restarting, check:
1. PM2 logs show no errors
2. Visit the checkout page - should not show "Stripe publishable key is not configured"
3. Stripe payment form should load

