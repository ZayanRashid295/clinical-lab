# Database Seeding Guide

## Problem
You have database tables but no data (0 entries). The seed scripts need to be run to populate the database.

## Solution

### Step 1: Create `.env` file

You need to create a `.env` file in the `backend` directory with your database connection string.

1. Copy the example file:
   ```bash
   cd backend
   cp env.example .env
   ```

2. Edit the `.env` file and update the `DATABASE_URL` with your actual MySQL credentials:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   ```

   Replace:
   - `username` - Your MySQL username
   - `password` - Your MySQL password
   - `localhost:3306` - Your MySQL host and port (if different)
   - `database_name` - Your database name

   Example:
   ```env
   DATABASE_URL="mysql://root:mypassword@localhost:3306/uber_db"
   ```

### Step 2: Run the seed script

Once your `.env` file is configured, run:

```bash
cd backend
npm run prisma:seed
```

This will:
1. **seed-base.ts**: Create users, roles, permissions, wallets, chat rooms, notifications, etc.
2. **seed-payments.ts**: Create 100 payment records, refunds, wallet transactions
3. **seed-usmle.ts**: Create USMLE Step 1 product structure with sections, chapters, topics, subscription packages

### Step 3: Verify the data

After seeding, you can verify the data using Prisma Studio:

```bash
cd backend
npm run prisma:studio
```

Then open http://localhost:5555 in your browser.

## What gets seeded?

### Base Data (seed-base.ts)
- **5 Roles**: PASSENGER, DRIVER, ADMIN, SUPPORT, FLEET_MANAGER
- **17 Users**: Including admin@uber.com, support@uber.com, and test users
- **13 Permissions**: Various user, ride, payment, and admin permissions
- **Wallets**: For some users with balances
- **Payment Methods**: Credit cards for some users
- **Chat Rooms**: 2 chat rooms with participants and messages
- **Notification Preferences**: For all users
- **Promo Codes**: WELCOME10 and FIRSTRIDE
- **System Settings**: App configuration

### Payment Data (seed-payments.ts)
- **100 Payments**: Various statuses, methods, and gateways
- **10 Refunds**: For completed payments
- **Wallet Transactions**: For wallet-based payments
- **Promo Code Usages**: Some payments with discounts
- **Additional Payment Methods**: For users without payment methods

### USMLE Data (seed-usmle.ts)
- **1 Product**: USMLE Step 1
- **13 Product Tags**: Anatomy, Biochemistry, Microbiology, etc.
- **3 Sections**: General Principles, Clinical Sciences, Organ Systems
- **26 Chapters**: Biochemistry, Genetics, Cardiovascular, etc.
- **169+ Topics**: Detailed topics within each chapter
- **3 Product Subtypes**: Qbank, Self-Assessment, Biostatistics Review
- **6 Package Features**: Qbank Access, Self Assessment, etc.
- **4 Subscription Packages**: Basic, Standard, Premium, Ultimate

## Test Credentials

After seeding, you can use these test accounts:

- **Passenger**: john.doe@example.com / password123
- **Driver**: mike.wilson@example.com / password123
- **Admin**: admin@uber.com / password123
- **Support**: support@uber.com / password123
- **Fleet Manager**: fleet@uber.com / password123

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
- Make sure you have a `.env` file in the `backend` directory
- Check that `DATABASE_URL` is set correctly in the `.env` file

### Error: "Can't reach database server"
- Verify your MySQL server is running
- Check that the host, port, username, and password are correct
- Ensure the database exists

### Error: "Table doesn't exist"
- Run migrations first: `npm run prisma:migrate`
- Or push the schema: `npm run prisma:push`

### Seeding fails partway through
- The seed scripts use `upsert`, so you can safely run them multiple times
- They won't create duplicate data due to unique constraints


