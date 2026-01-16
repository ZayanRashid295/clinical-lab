# Fix Stripe Backend Secret Key Error

## Error
```
Invalid API Key provided: sk_test_...
```

## Problem
The backend needs a valid Stripe **Secret Key** (not the publishable key). The secret key should:
- Start with `sk_test_` (for test mode) or `sk_live_` (for production)
- Match the same Stripe account as your publishable key
- Be configured in `backend/.env` as `STRIPE_SECRET_KEY`

## Solution

### Step 1: Get Your Stripe Secret Key

1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
   - This is different from the publishable key (which starts with `pk_test_`)
   - Keep it secret - never commit it to git!

### Step 2: Update Backend .env File

Run these commands on your server:

```bash
cd ~/deployments/clinical-lab/backend

# Check if .env exists
ls -la .env

# Add or update STRIPE_SECRET_KEY in .env
# Replace YOUR_SECRET_KEY_HERE with your actual secret key from Stripe Dashboard
echo 'STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE' >> .env

# Or edit manually
nano .env
# Add: STRIPE_SECRET_KEY=sk_test_...
```

### Step 3: Verify .env File

```bash
cd ~/deployments/clinical-lab/backend

# Check if STRIPE_SECRET_KEY is set (without showing the actual key)
grep STRIPE_SECRET_KEY .env | sed 's/=.*/=***HIDDEN***/'
```

### Step 4: Restart Backend

```bash
cd ~/deployments/clinical-lab

# Restart backend to load new env variable
pm2 restart clinical-lab-backend

# Check logs for errors
pm2 logs clinical-lab-backend --lines 30
```

## Important Notes

1. **Test vs Live Keys:**
   - If your publishable key is `pk_test_...`, use `sk_test_...` (test mode)
   - If your publishable key is `pk_live_...`, use `sk_live_...` (live mode)
   - **Never mix test and live keys!**

2. **Key Pairs:**
   - Publishable key: `pk_test_51SebsD2UvlnmUV8rLHcG5rLR23uu668uxPQ1Y6Io3OJJF1Svfh45oxlCNiLSrvLWi4xLTBFfYoobrP4wAiL673hs00uDEacnfb`
   - Secret key: Should be from the same Stripe account, starts with `sk_test_...`

3. **Security:**
   - Never commit `.env` files to git
   - Keep secret keys secure
   - Use different keys for test and production

## Quick Fix Command

```bash
cd ~/deployments/clinical-lab/backend && \
echo "STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE" >> .env && \
cd .. && \
pm2 restart clinical-lab-backend && \
pm2 logs clinical-lab-backend --lines 20
```

**Replace `sk_test_YOUR_SECRET_KEY_HERE` with your actual secret key from Stripe Dashboard.**

