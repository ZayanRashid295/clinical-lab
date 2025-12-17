# Phase 1 Testing Guide: Webhook Security & End-to-End Testing

## 📋 Prerequisites

Before starting, ensure you have:

1. **Backend running** on `http://localhost:3000`
2. **Frontend running** on `http://localhost:3001`
3. **Stripe test account** configured:
   - Test secret key (`sk_test_...`) in `backend/.env` as `STRIPE_SECRET_KEY`
   - Test publishable key (`pk_test_...`) in `frontend-next/.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Webhook secret (`whsec_...`) in `backend/.env` as `STRIPE_WEBHOOK_SECRET` (optional for dev)
4. **Database seeded** with subscription packages (Basic package ID: `cmhuiu0kv00olgi5f99c8kf4o`)
5. **Test user account** (e.g., `admin@uber.com` / `password123`)

---

## 🧪 Testing Steps

### Step 1: Verify Backend is Running

```bash
cd backend
npm run start:dev
```

**Expected output:**
```
🚀 Application is running on: http://localhost:3000
📚 Swagger documentation: http://localhost:3000/api/docs
```

**Verify:**
- Open `http://localhost:3000/api/docs` in browser
- Should see Swagger UI with all API endpoints

---

### Step 2: Verify Frontend is Running

```bash
cd frontend-next
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3001
- Local: http://localhost:3001
```

**Verify:**
- Open `http://localhost:3001` in browser
- Should see landing page

---

### Step 3: Test Authentication (Get JWT Token)

**Login to get access token:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@uber.com",
    "password": "password123"
  }'
```

**Expected response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHViZXIuY29tIiwic3ViIjoiY21odWl0enU4MDAwbWdpNWYyaTh0dHBrNCIsImlhdCI6MTc2NTg4MzAyMSwiZXhwIjoxNzY2NDg3ODIxfQ.kpbXnTswrTreOYwy0y8TvIEx3JwsRUPRvNzxDAJhV6Q",
  "user": {
    "id": "cmhuitzu8000mgi5f2i8ttpk4",
    "email": "admin@uber.com",
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHViZXIuY29tIiwic3ViIjoiY21odWl0enU4MDAwbWdpNWYyaTh0dHBrNCIsImlhdCI6MTc2NTg4MzQ5OSwiZXhwIjoxNzY2NDg4Mjk5fQ.hQ4BGCF_SwwbEmgsV8Bg7AppjFZvb29olktDMwUBR2E

cmhuitzu8000mgi5f2i8ttpk4

**Save the `access_token` and `user.id` for next steps.**

---

### Step 4: Test Payment Creation (Backend API)

**Create a payment intent:**

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHViZXIuY29tIiwic3ViIjoiY21odWl0enU4MDAwbWdpNWYyaTh0dHBrNCIsImlhdCI6MTc2NTg4MzQ5OSwiZXhwIjoxNzY2NDg4Mjk5fQ.hQ4BGCF_SwwbEmgsV8Bg7AppjFZvb29olktDMwUBR2E" \
  -d '{
    "userId": "cmhuitzu8000mgi5f2i8ttpk4",
    "subscriptionPackageId": "cmhuiu0kv00olgi5f99c8kf4o",
    "description": "Basic Qbank subscription"
  }'
```

**Expected response:**
```json
{
  "paymentId": "cm...",
  "clientSecret": "pi_..._secret_...",
  "amount": 49.99,
  "currency": "USD"
}
```

**Save the `paymentId` and `clientSecret` for verification.**

cmj8hhfj000018kf125564zj7

pi_3SewBS2UvlnmUV8r0vLRYGbm_secret_cneMRZlsRnsx7rXpKhhi240zr

**Verify in database:**
- Check `payments` table
- Should see new payment with:
  - `status: PENDING`
  - `gateway: STRIPE`
  - `transactionId: pi_...` (Stripe Payment Intent ID)

---

### Step 5: Test Webhook (Dev Mode - Without Signature)

**Test webhook without signature (dev mode should work):**

```bash
curl -X POST http://localhost:3000/payments/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "<PAYMENT_INTENT_ID_FROM_STEP_4>",
        "status": "succeeded",
        "amount": 4999,
        "currency": "usd",
        "metadata": {
          "userId": "<USER_ID>",
          "subscriptionPackageId": "cmhuiu0kv00olgi5f99c8kf4o"
        }
      }
    }
  }'
```

**Expected response:**
```json
{
  "received": true
}
```

**Check backend logs for:**
```
🔔 Received unverified Stripe webhook: payment_intent.succeeded
```

**Verify in database:**
- Check `payments` table
- Payment status should be updated to `COMPLETED`
- Check `subscriptions` table
- Should see new subscription with:
  - `status: ACTIVE`
  - `userId: <USER_ID>`
  - `subscriptionPackageId: cmhuiu0kv00olgi5f99c8kf4o`
  - `startDate` and `endDate` set (endDate = startDate + 30 days)

---

### Step 6: Test Webhook with Invalid Signature (Should Fail)

**Test with invalid signature (should be rejected if webhook secret is set):**

```bash
curl -X POST http://localhost:3000/payments/webhook/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid_signature" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test123",
        "status": "succeeded"
      }
    }
  }'
```

**Expected response (if `STRIPE_WEBHOOK_SECRET` is set):**
```json
{
  "message": "Invalid webhook signature",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**Expected response (if `STRIPE_WEBHOOK_SECRET` is NOT set):**
```json
{
  "received": true
}
```

---

### Step 7: Test Frontend Checkout Flow

1. **Open landing page:** `http://localhost:3001`
2. **Scroll to Pricing section**
3. **Click "Start Free Trial" on Student or Student Pro card**
4. **Should redirect to:** `http://localhost:3001/checkout-basic`

**If not logged in:**
- Should show error: "You must be logged in to purchase a subscription"
- Should redirect to home page
- Click "Login" button, sign in with test credentials
- Navigate back to `/checkout-basic`

**If logged in:**
- Should see checkout form with:
  - "Basic Qbank Subscription"
  - Amount: $49.99 USD
  - Stripe card input field
  - "Pay now" button

---

### Step 8: Test Payment with Stripe Test Card

**Use Stripe test card:**
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Steps:**
1. Fill in the card details
2. Click "Pay now"

**Expected behavior:**
- Button shows "Processing..." (disabled)
- After success: "Payment successful! Your subscription will be activated shortly."
- Payment Intent created in Stripe Dashboard with status `succeeded`

**Note:** In development, you need to manually trigger the webhook (Step 5) or use Stripe CLI (Step 9) to complete the subscription creation.

---

### Step 9: Test Webhook with Stripe CLI (Recommended for Proper Testing)

**Install Stripe CLI (if not installed):**
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
# See: https://stripe.com/docs/stripe-cli
```

**Login to Stripe:**
```bash
stripe login
```

**Forward webhooks to local backend:**
```bash
stripe listen --forward-to localhost:3000/payments/webhook/stripe
```

**The CLI will output:**
```
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

**Copy the webhook secret and add to `backend/.env`:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Restart backend** to load the new environment variable.

**In another terminal, trigger a test event:**
```bash
stripe trigger payment_intent.succeeded
```

**Expected:**
- Stripe CLI shows: `Webhook received: payment_intent.succeeded`
- Backend logs show: `🔔 Verified Stripe webhook: payment_intent.succeeded`
- Payment status updated to `COMPLETED`
- Subscription created (if `subscriptionPackageId` in metadata)

---

### Step 10: Verify Subscription Created

**Check via API:**

```bash
curl -X GET "http://localhost:3000/subscriptions?userId=<USER_ID>&status=ACTIVE" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected response:**
```json
[
  {
    "id": "...",
    "userId": "...",
    "subscriptionPackageId": "cmhuiu0kv00olgi5f99c8kf4o",
    "status": "ACTIVE",
    "startDate": "2025-01-15T...",
    "endDate": "2025-02-14T...",
    "subscriptionPackage": {
      "name": "Basic",
      "price": "49.99",
      "validityDays": 30
    }
  }
]
```

**Check via Admin UI (if available):**
1. Log in as admin
2. Navigate to subscriptions page
3. Should see the newly created subscription with `ACTIVE` status

---

### Step 11: Test Payment Failure Webhook

**Test failed payment webhook:**

```bash
curl -X POST http://localhost:3000/payments/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.payment_failed",
    "data": {
      "object": {
        "id": "<PAYMENT_INTENT_ID>",
        "status": "requires_payment_method",
        "last_payment_error": {
          "message": "Your card was declined."
        }
      }
    }
  }'
```

**Expected:**
- Backend logs: `🔔 Received unverified Stripe webhook: payment_intent.payment_failed`
- Payment status updated to `FAILED` in database

---

## 🔧 Stripe Webhook Configuration (Production)

### Option 1: Stripe Dashboard (Recommended for Production)

1. **Go to Stripe Dashboard:** https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Enter endpoint URL:**
   ```
   https://your-domain.com/payments/webhook/stripe
   ```
4. **Select events to listen to:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. **Copy the "Signing secret"** (starts with `whsec_`)
6. **Add to production environment:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Option 2: Stripe CLI (For Local Development)

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:3000/payments/webhook/stripe

# The CLI will show you the webhook signing secret
# Add it to backend/.env: STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🐛 Troubleshooting

### Error: "Missing Stripe signature header"

**Cause:** Webhook secret is configured but no signature provided.

**Solution:**
- In dev mode: Remove `STRIPE_WEBHOOK_SECRET` from `.env` or set to `whsec_dummy`
- In production: Always provide valid Stripe signature

### Error: "Invalid webhook signature"

**Cause:** Signature doesn't match the webhook secret.

**Solutions:**
1. Ensure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard
2. Ensure you're using the **raw request body** (not parsed JSON) for signature verification
3. For local dev, you can temporarily remove the secret to allow unverified webhooks

### Payment created but subscription not created

**Check:**
1. Webhook was received (check backend logs)
2. `payment_intent.succeeded` event was processed
3. Payment has `subscriptionPackageId` in metadata
4. `SubscriptionPackage` exists in database with that ID

**Debug:**
```bash
# Check payment status
curl -X GET http://localhost:3000/payments/<PAYMENT_ID> \
  -H "Authorization: Bearer <TOKEN>"

# Check if subscription was created
curl -X GET http://localhost:3000/subscriptions?userId=<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

### Frontend checkout page shows "Stripe publishable key not configured"

**Solution:**
1. Create `frontend-next/.env.local` if it doesn't exist
2. Add: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
3. Restart Next.js dev server: `npm run dev`

### Backend returns 401 Unauthorized on payment creation

**Cause:** Missing or invalid JWT token.

**Solution:**
1. Login again to get a fresh token
2. Include token in `Authorization: Bearer <token>` header
3. Ensure token hasn't expired

### Webhook endpoint returns 401 even without signature

**Cause:** `STRIPE_WEBHOOK_SECRET` is set but you're testing without signature.

**Solution:**
- Remove `STRIPE_WEBHOOK_SECRET` from `.env` for dev testing
- Or use Stripe CLI to get properly signed webhooks

---

## ✅ Phase 1 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login and get JWT token
- [ ] Can create payment via API
- [ ] Payment appears in database with `PENDING` status
- [ ] Webhook accepts unverified requests in dev mode
- [ ] Webhook rejects invalid signatures (if secret is set)
- [ ] Webhook updates payment status to `COMPLETED`
- [ ] Webhook creates subscription when payment succeeds
- [ ] Frontend checkout page loads correctly
- [ ] Can complete payment with Stripe test card
- [ ] Subscription appears in database after webhook
- [ ] Can retrieve subscription via API
- [ ] Payment failure webhook updates payment to `FAILED`

---

## 📝 What Was Implemented in Phase 1

### 1. Stripe Webhook Signature Verification

**Files modified:**
- `backend/src/modules/payments/stripe.service.ts` - Added `verifyWebhookSignature()` method
- `backend/src/modules/payments/payments.service.ts` - Updated webhook handler with signature verification
- `backend/src/modules/payments/payments.controller.ts` - Removed JWT guard from webhook endpoint
- `backend/src/modules/payments/payments.module.ts` - Added `ConfigModule` import

**Security:**
- ✅ Production: Requires valid Stripe signature or throws `401 Unauthorized`
- ✅ Development: Falls back to unverified mode if `STRIPE_WEBHOOK_SECRET` not set
- ✅ All other payment endpoints still protected with JWT

---

## 🔐 Security Notes

1. **Webhook endpoint is public** (no JWT) but secured via Stripe signature verification
2. **In production:** Always set `STRIPE_WEBHOOK_SECRET` - unverified webhooks will be rejected
3. **In development:** Can work without secret for manual testing, but should use Stripe CLI for proper testing
4. **HTTPS required:** Stripe webhooks require HTTPS in production (use ngrok or similar for local testing)

---

## 📝 Next Steps (Phase 2)

1. Create user-facing "My Subscription" page
2. Add payment success confirmation page
3. Implement subscription-based access control
4. Add subscription expiry automation

---

## 🎯 Quick Test Commands Reference

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uber.com","password":"password123"}'

# 2. Create Payment (replace TOKEN and USER_ID)
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"userId":"<USER_ID>","subscriptionPackageId":"cmhuiu0kv00olgi5f99c8kf4o"}'

# 3. Test Webhook (replace PAYMENT_INTENT_ID and USER_ID)
curl -X POST http://localhost:3000/payments/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"payment_intent.succeeded","data":{"object":{"id":"<PI_ID>","status":"succeeded","metadata":{"userId":"<USER_ID>","subscriptionPackageId":"cmhuiu0kv00olgi5f99c8kf4o"}}}}'

# 4. Check Subscriptions (replace TOKEN and USER_ID)
curl -X GET "http://localhost:3000/subscriptions?userId=<USER_ID>&status=ACTIVE" \
  -H "Authorization: Bearer <TOKEN>"
```

---

**Happy Testing! 🚀**
