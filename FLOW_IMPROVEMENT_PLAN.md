# Payment & Subscription Flow Improvement Plan

## Overview
This plan addresses routing issues, subscription management, user flow improvements, and pricing display synchronization.

---

## Issues Identified

### 1. **Checkout Page Routing Issues**
- ❌ After successful payment → redirects to dashboard (should stay on checkout page)
- ❌ After pending/failed payment → redirects away (should stay on checkout page)
- ✅ **Fix**: Keep user on checkout page, show status messages, add "Go to Dashboard" button

### 2. **Subscription Management**
- ❌ Creating new subscription doesn't cancel previous one
- ❌ No check for existing subscription before checkout
- ✅ **Fix**: 
  - Backend: Cancel previous ACTIVE subscription when creating new one
  - Frontend: Check for existing subscription on checkout page
  - Show modal with options: Cancel & Create New OR Continue with Existing

### 3. **User Flow Issues**
- ❌ User must: Login → Dashboard → Manually type `/landing-page` → Click "Start Free Trial"
- ✅ **Proposed Flow**:
  - Login → Dashboard
  - If no subscription → Show modal (like image) on dashboard
  - Modal "Subscribe" button → Navigate to landing page pricing section
  - If has subscription → Show dashboard normally

### 4. **Pricing Display**
- ❌ All plans show "$49" (hardcoded)
- ❌ Not synced with database
- ✅ **Fix**: Fetch subscription packages from backend, display actual prices

---

## Implementation Plan

### Phase 1: Fix Checkout Page Routing & Stay on Page

**Changes:**
1. **`frontend-next/pages/checkout-basic.tsx`**
   - Remove any auto-redirects after payment
   - Keep user on checkout page after success/pending/failed
   - Show appropriate status messages
   - Add "Go to Dashboard" button (manual navigation)
   - Add "View My Subscription" button if payment succeeded

**Files to Modify:**
- `frontend-next/pages/checkout-basic.tsx`

---

### Phase 2: Subscription Management - Cancel Previous on New

**Backend Changes:**
1. **`backend/src/modules/payments/payments.service.ts`**
   - In `handlePaymentIntentSucceeded()` method:
     - Before creating new subscription, check for existing ACTIVE subscriptions for the user
     - Cancel all ACTIVE subscriptions (set status to CANCELLED)
     - Then create new subscription

**Frontend Changes:**
1. **`frontend-next/pages/checkout-basic.tsx`**
   - On page load, check for existing ACTIVE subscription
   - If exists, show modal/alert with:
     - Info about existing subscription (package name, end date)
     - Two options:
       - "Cancel & Create New" → Proceed with payment (backend will cancel old)
       - "Continue with Existing" → Navigate to dashboard

**Files to Modify:**
- `backend/src/modules/payments/payments.service.ts`
- `frontend-next/pages/checkout-basic.tsx`
- `frontend-next/src/app/services/subscriptions/subscriptions.service.ts` (add getUserSubscriptions method)

---

### Phase 3: Dashboard Modal for Non-Subscribed Users

**Changes:**
1. **`frontend-next/pages/dashboard.tsx`**
   - After authentication check, fetch user's subscriptions
   - If no ACTIVE subscription exists:
     - Show modal (like image) with:
       - Acknowledgment text
       - "Access My Account" button → Close modal, show dashboard
       - "Subscribe" button → Navigate to `/landing-page#pricing`
   - If ACTIVE subscription exists:
     - Show dashboard normally

2. **Create Modal Component**
   - `frontend-next/src/app/components/SubscriptionAcknowledgmentModal.tsx`
   - Reusable modal matching the image design

**Files to Create:**
- `frontend-next/src/app/components/SubscriptionAcknowledgmentModal.tsx`

**Files to Modify:**
- `frontend-next/pages/dashboard.tsx`
- `frontend-next/src/app/services/subscriptions/subscriptions.service.ts`

---

### Phase 4: Dynamic Pricing from Database

**Backend:**
- Already has endpoint: `GET /subscriptions/packages`
- Returns packages with `price`, `name`, `validityDays`, etc.

**Frontend Changes:**
1. **`frontend-next/src/app/components/LandingPage/LandingPage.tsx`**
   - Fetch subscription packages on component mount
   - Pass packages to `PricingGrid` component

2. **`frontend-next/src/app/components/LandingPage/LandingPage.tsx` (PricingGrid)**
   - Accept `packages: SubscriptionPackage[]` prop
   - Map packages to pricing cards dynamically
   - Use actual `price`, `name`, `description` from database
   - Handle "Custom" pricing for Institution plan

3. **`frontend-next/src/app/components/LandingPage/PricingCard.tsx`**
   - Update to accept `packageId` prop
   - Pass `packageId` to `onSelect` callback

4. **`frontend-next/pages/checkout-basic.tsx`**
   - Accept `packageId` as query parameter or route param
   - Use dynamic `packageId` instead of hardcoded `BASIC_PACKAGE_ID`

**Files to Modify:**
- `frontend-next/src/app/components/LandingPage/LandingPage.tsx`
- `frontend-next/src/app/components/LandingPage/PricingCard.tsx`
- `frontend-next/pages/checkout-basic.tsx`
- `frontend-next/pages/landing-page.tsx` (if needed)

---

## Detailed Implementation Steps

### Step 1: Backend - Cancel Previous Subscription on New Payment

**File:** `backend/src/modules/payments/payments.service.ts`

**Location:** `handlePaymentIntentSucceeded()` method, before creating subscription

**Code:**
```typescript
// Before creating new subscription, cancel any existing ACTIVE subscriptions
const existingSubscriptions = await this.prisma.subscription.findMany({
  where: {
    userId: payment.userId,
    status: SubscriptionStatus.ACTIVE,
  },
});

if (existingSubscriptions.length > 0) {
  await this.prisma.subscription.updateMany({
    where: {
      userId: payment.userId,
      status: SubscriptionStatus.ACTIVE,
    },
    data: {
      status: SubscriptionStatus.CANCELLED,
    },
  });
  
  Logger.log(
    `Cancelled ${existingSubscriptions.length} existing subscription(s) for user ${payment.userId}`,
    "PaymentsService"
  );
}
```

---

### Step 2: Frontend - Check Existing Subscription on Checkout

**File:** `frontend-next/pages/checkout-basic.tsx`

**Changes:**
1. Add state for existing subscription
2. Fetch user subscriptions on mount
3. Show modal if ACTIVE subscription exists
4. Handle "Cancel & Create New" vs "Continue with Existing"

---

### Step 3: Frontend - Dashboard Modal

**File:** `frontend-next/pages/dashboard.tsx`

**Changes:**
1. Fetch user subscriptions after auth check
2. Show modal if no ACTIVE subscription
3. Modal matches image design
4. "Subscribe" button navigates to `/landing-page#pricing`

---

### Step 4: Frontend - Dynamic Pricing

**File:** `frontend-next/src/app/components/LandingPage/LandingPage.tsx`

**Changes:**
1. Import `useSubscriptionPackages` hook
2. Fetch packages on mount
3. Pass packages to `PricingGrid`
4. Update `PricingGrid` to map packages dynamically
5. Update routing to pass `packageId` to checkout

---

## API Endpoints Used

1. **`GET /subscriptions/user/:userId?status=ACTIVE`**
   - Get user's active subscriptions
   - Used in: Dashboard, Checkout page

2. **`GET /subscriptions/packages`**
   - Get all subscription packages with prices
   - Used in: Landing page pricing section

3. **`DELETE /subscriptions/:id`**
   - Cancel subscription (already exists)
   - Used in: Backend auto-cancel logic

---

## Testing Checklist

### Phase 1: Checkout Page
- [ ] Payment success → Stay on page, show success message
- [ ] Payment failed → Stay on page, show error message
- [ ] Payment pending → Stay on page, show pending message
- [ ] "Go to Dashboard" button works
- [ ] "View My Subscription" button works (if payment succeeded)

### Phase 2: Subscription Management
- [ ] Create new subscription → Previous ACTIVE subscription cancelled
- [ ] Checkout page shows existing subscription modal
- [ ] "Cancel & Create New" works
- [ ] "Continue with Existing" navigates to dashboard

### Phase 3: Dashboard Modal
- [ ] User with no subscription → Modal appears
- [ ] Modal matches image design
- [ ] "Subscribe" button → Navigates to landing page pricing
- [ ] "Access My Account" button → Closes modal, shows dashboard
- [ ] User with subscription → No modal, dashboard shows normally

### Phase 4: Dynamic Pricing
- [ ] Landing page fetches packages from backend
- [ ] Pricing cards show actual prices from database
- [ ] Clicking pricing card → Navigates to checkout with correct packageId
- [ ] Checkout page uses correct packageId

---

## User Flow Diagrams

### Current Flow (Problematic)
```
Login → Dashboard → [User manually types /landing-page] → Landing Page → Click "Start Free Trial" → Checkout → Payment → Redirect to Dashboard
```

### Proposed Flow (Improved)
```
Login → Dashboard
  ├─ Has Subscription → Show Dashboard
  └─ No Subscription → Show Modal
      ├─ "Access My Account" → Close Modal, Show Dashboard
      └─ "Subscribe" → Landing Page (#pricing) → Select Plan → Checkout
          ├─ Has Existing Subscription → Show Modal
          │   ├─ "Cancel & Create New" → Payment → Cancel Old → Create New
          │   └─ "Continue with Existing" → Dashboard
          └─ No Existing Subscription → Payment → Create Subscription
              └─ Success → Stay on Checkout Page → "Go to Dashboard" button
```

---

## Files Summary

### Backend (1 file)
- `backend/src/modules/payments/payments.service.ts`

### Frontend (6 files)
- `frontend-next/pages/checkout-basic.tsx`
- `frontend-next/pages/dashboard.tsx`
- `frontend-next/src/app/components/LandingPage/LandingPage.tsx`
- `frontend-next/src/app/components/LandingPage/PricingCard.tsx`
- `frontend-next/src/app/components/SubscriptionAcknowledgmentModal.tsx` (NEW)
- `frontend-next/src/app/services/subscriptions/subscriptions.service.ts`

---

## Estimated Implementation Time

- Phase 1: 30 minutes
- Phase 2: 45 minutes
- Phase 3: 45 minutes
- Phase 4: 30 minutes
- **Total: ~2.5 hours**

---

## Notes

1. **Subscription Cancellation**: When creating a new subscription, we cancel ALL ACTIVE subscriptions for the user. This ensures only one active subscription at a time.

2. **Modal Design**: The acknowledgment modal should match the image provided (blue header, white background, two buttons).

3. **Pricing Sync**: All pricing comes from database via `GET /subscriptions/packages` endpoint. No hardcoded prices.

4. **Routing**: Use Next.js router with hash navigation for pricing section: `router.push('/landing-page#pricing')`.

5. **Error Handling**: Handle cases where:
   - User has no subscriptions
   - API calls fail
   - Subscription packages not found
   - Payment fails

---

## Questions for Confirmation

1. Should we cancel ALL active subscriptions or just the most recent one?
   - **Decision**: Cancel ALL active subscriptions (ensures clean state)

2. Should the modal appear every time user logs in without subscription, or only once?
   - **Decision**: Every time (reminds user to subscribe)

3. Should we allow multiple subscriptions for different packages?
   - **Decision**: No, only one active subscription at a time (simpler UX)

4. What happens to expired subscriptions?
   - **Decision**: They remain in database but don't block new subscriptions

---

## Ready to Implement?

This plan addresses all issues mentioned:
- ✅ Checkout page stays on page after payment
- ✅ New subscription cancels previous one
- ✅ Checkout page checks for existing subscription
- ✅ Dashboard shows modal for non-subscribed users
- ✅ Pricing is dynamic from database
- ✅ Proper routing throughout

**Proceed with implementation?**












