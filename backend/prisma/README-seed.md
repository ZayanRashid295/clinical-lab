# Database Seeding

This directory contains the database seeding script for the Uber application.

## Overview

The seed script (`seed.ts`) creates comprehensive test data for all modules and user roles in the application.

## What Gets Created

### 👥 Users & Roles

- **5 User Roles**: Passenger, Driver, Admin, Support, Fleet Manager
- **7 Test Users**: 2 passengers, 2 drivers, 1 admin, 1 support, 1 fleet manager
- **Role Assignments**: Each user assigned to their appropriate role
- **User Settings**: Personalized settings for each user

### 🔐 Permissions

- **13 Permissions**: Covering user, ride, payment, admin, analytics, and support operations
- **Role-Permission Mapping**: Permissions assigned to appropriate roles

### 🗺️ Location Data

- **3 Sample Locations**: Downtown Office, Airport Terminal, Shopping Mall
- **Driver Locations**: Real-time driver positions
- **User Addresses**: Home and work addresses for passengers

### 💰 Financial Data

- **Wallets**: Starting balances for all users
- **Payment Methods**: Credit card information for passengers
- **Sample Payments**: Completed and pending ride payments

### 🚖 Ride Data

- **2 Sample Rides**: One completed, one in progress
- **Ride Reviews**: 5-star reviews between passengers and drivers
- **Location Tracking**: Pickup and dropoff coordinates

### 💬 Communication

- **Chat Rooms**: Ride-specific chat rooms
- **Chat Participants**: Passengers and drivers in each room
- **Sample Messages**: Realistic conversation examples

### 🔔 Notifications

- **2 Sample Notifications**: Ride completion and new ride request
- **Notification Preferences**: Personalized settings for each user

### 🎟️ Promotional

- **2 Promo Codes**: Welcome bonus and first ride discount
- **Usage Tracking**: Available for testing promotions

### ⚙️ System Configuration

- **7 System Settings**: App configuration, pricing, maintenance mode
- **Service Areas**: New York City coverage area

## Running the Seed Script

### Prerequisites

1. Database must be set up and migrated
2. Environment variables configured
3. Dependencies installed

### Commands

```bash
# Install dependencies (if not already done)
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed
```

### Alternative: Direct Execution

```bash
# Using tsx directly
npx tsx prisma/seed.ts

# Using ts-node
npx ts-node prisma/seed.ts
```

## Test Credentials

After seeding, you can use these credentials to test different user roles:

| Role          | Email                     | Password    | Description                  |
| ------------- | ------------------------- | ----------- | ---------------------------- |
| Passenger     | john.doe@example.com      | password123 | Regular user who books rides |
| Passenger     | jane.smith@example.com    | password123 | Another passenger account    |
| Driver        | mike.wilson@example.com   | password123 | Driver who provides rides    |
| Driver        | sarah.johnson@example.com | password123 | Another driver account       |
| Admin         | admin@uber.com            | password123 | Platform administrator       |
| Support       | support@uber.com          | password123 | Customer support agent       |
| Fleet Manager | fleet@uber.com            | password123 | Fleet management personnel   |

## Data Relationships

The seed data creates realistic relationships between entities:

- **Passengers** have wallets, payment methods, and addresses
- **Drivers** have location data and earnings
- **Rides** connect passengers and drivers with location data
- **Chat rooms** are created for each ride
- **Notifications** are sent for ride events
- **Reviews** are exchanged between passengers and drivers

## Customization

To modify the seed data:

1. **Add more users**: Extend the users array in the script
2. **Change locations**: Modify the locations array with your city's coordinates
3. **Adjust pricing**: Update the system settings for different fare structures
4. **Add more roles**: Create additional roles and assign permissions
5. **Modify notifications**: Add more notification types and messages

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure DATABASE_URL is correctly set in .env
   - Verify database is running and accessible

2. **Permission Denied**
   - Check database user permissions
   - Ensure user has CREATE, INSERT, UPDATE privileges

3. **Duplicate Key Errors**
   - The script uses upsert operations to prevent duplicates
   - If errors persist, check for conflicting data

4. **TypeScript Errors**
   - Ensure all dependencies are installed
   - Run `npm run prisma:generate` to update Prisma client

### Reset Database

To start fresh:

```bash
# Reset database (WARNING: This deletes all data)
npx prisma migrate reset

# Or manually drop and recreate
npx prisma db push --force-reset
```

## Production Considerations

⚠️ **Important**: This seed script is designed for development and testing only. Do not run it in production environments as it:

- Uses test credentials
- Creates sample data
- May conflict with existing production data

For production, create a separate, more controlled seeding process that:

- Uses secure credentials
- Validates data integrity
- Handles existing data gracefully
- Includes proper error handling and logging

