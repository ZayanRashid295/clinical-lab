# Payment Seeding Documentation

This document explains how to use the payment seeding functionality to populate your database with realistic payment data.

## Files Created

- `seed-payments.ts` - Main payment seeding function
- `seed-payments-only.ts` - Standalone script to run only payment seeding
- `seed.ts` - Updated main seed file that includes payment seeding

## What Gets Created

The payment seeding creates:

### 1. **50 Payment Records**

- Various payment statuses: COMPLETED, PENDING, PROCESSING, FAILED, CANCELLED, REFUNDED
- Different payment methods: CARD, WALLET, CASH, BANK_TRANSFER
- Multiple payment gateways: STRIPE, PAYPAL, RAZORPAY, SQUARE
- Medical-related descriptions (consultations, lab tests, procedures, etc.)
- Realistic amounts ranging from $25 to $2000
- Random dates within the last 6 months

### 2. **Refunds**

- Up to 10 refunds for completed payments
- Various refund reasons (patient requested, service not provided, etc.)
- Updates original payment status to REFUNDED

### 3. **Wallet Transactions**

- Creates wallet transactions for WALLET payment method payments
- Updates wallet balances accordingly
- Links transactions to payments

### 4. **Promo Code Usages**

- Creates promo code usages for eligible payments
- Uses existing WELCOME10 promo code
- Applies 10% discount up to $5

### 5. **Additional Payment Methods**

- Creates payment methods for users who don't have any
- Includes realistic card metadata (last 4 digits, brand, expiry)

## How to Run

### Option 1: Run All Seeding (Recommended)

```bash
cd backend
npx ts-node prisma/seed.ts
```

### Option 2: Run Only Payment Seeding

```bash
cd backend
npx ts-node prisma/seed-payments-only.ts
```

### Option 3: Run from Package.json Script

Add to your `package.json`:

```json
{
  "scripts": {
    "seed": "ts-node prisma/seed.ts",
    "seed:payments": "ts-node prisma/seed-payments-only.ts"
  }
}
```

Then run:

```bash
npm run seed:payments
```

## Prerequisites

- **Users must exist**: The payment seeding requires users to be created first
- **Run seed-base first**: Make sure to run `seedBase(prisma)` before `seedPayments(prisma)`
- **Database connection**: Ensure your database is running and accessible

## Data Distribution

The seeding creates a realistic distribution:

### Payment Statuses

- COMPLETED: ~40% of payments
- PENDING: ~20% of payments
- PROCESSING: ~15% of payments
- FAILED: ~10% of payments
- CANCELLED: ~10% of payments
- REFUNDED: ~5% of payments

### Payment Methods

- CARD: ~50% of payments
- WALLET: ~25% of payments
- CASH: ~15% of payments
- BANK_TRANSFER: ~10% of payments

### Payment Gateways

- STRIPE: ~40% of payments
- PAYPAL: ~25% of payments
- RAZORPAY: ~20% of payments
- SQUARE: ~15% of payments

## Sample Data Examples

### Payment Examples

```typescript
{
  amount: 150.00,
  currency: "USD",
  status: "COMPLETED",
  method: "CARD",
  gateway: "STRIPE",
  description: "Medical consultation fee",
  transactionId: "TXN123456789",
  gatewayData: {
    chargeId: "ch_1234567890",
    balanceTransaction: "txn_1234567890",
    receiptUrl: "https://payments.example.com/receipts/...",
    metadata: {
      source: "web",
      userAgent: "Mozilla/5.0...",
      ipAddress: "192.168.1.123"
    }
  }
}
```

### Refund Examples

```typescript
{
  amount: 150.00,
  reason: "Patient requested refund",
  status: "COMPLETED",
  gatewayRefundId: "re_1234567890",
  processedAt: "2024-01-16T10:30:00Z"
}
```

## Customization

You can customize the seeding by modifying `seed-payments.ts`:

### Change Number of Payments

```typescript
for (let i = 0; i < 100; i++) { // Change from 50 to 100
```

### Add More Descriptions

```typescript
descriptions: [
  "Medical consultation fee",
  "Lab test payment",
  "Your custom description here",
  // ... more descriptions
];
```

### Adjust Amount Ranges

```typescript
amounts: [10, 25, 50, 100, 200, 500, 1000, 2000, 5000]; // Add more amounts
```

### Modify Date Range

```typescript
// Change from 180 days to 365 days (1 year)
createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 365));
```

## Troubleshooting

### Error: "No users found"

- Make sure to run `seedBase(prisma)` first
- Check that users are being created successfully

### Error: "Payment method not found"

- The seeding will create payment methods automatically
- This error shouldn't occur with the current implementation

### Error: "Promo code not found"

- The seeding looks for "WELCOME10" promo code
- If it doesn't exist, promo code usages won't be created (this is fine)

## Database Impact

The seeding will:

- Create 50+ payment records
- Create 10+ refund records
- Create wallet transactions
- Create promo code usages
- Create additional payment methods
- Update wallet balances

**Note**: This will add data to your database. If you need to reset, you can:

1. Drop and recreate the database
2. Use Prisma's reset functionality
3. Manually delete payment-related records

## Integration with Frontend

Once seeded, the payment data will be available through:

- Backend API endpoints (`/payments`, `/payments/:id`)
- Payment service methods
- Frontend payment history table
- Payment filtering and search functionality

The seeded data provides realistic test data for development and testing of payment-related features.
