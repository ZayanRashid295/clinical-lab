# Role-Based Menu Access Implementation

## Overview
Implemented role-based menu access where:
- **SUPERADMIN**: Has access to ALL menu items
- **ADMIN**: Has limited access (only specific menu items)

## Menu Access Summary

### SUPERADMIN Access (All Items)
✅ Dashboard  
✅ Content Management  
✅ Subscriptions  
✅ Products  
✅ Study  
✅ Test Creation  
✅ Administration  
✅ Assessments  
✅ Misc  
✅ Messages  
✅ Payments  
✅ Development  

### ADMIN Access (Limited Items)
✅ Dashboard  
✅ Content Management  
✅ Subscriptions  
✅ Products  
✅ Study  
✅ Test Creation  
✅ Administration  
✅ Assessments  
❌ Misc (Hidden)  
❌ Messages (Hidden)  
❌ Payments (Hidden)  
❌ Development (Hidden)  

## Changes Made

### 1. Frontend Menu Configuration
**File**: `frontend-next/src/app/config/menu.config.ts`

- Added `SUPERADMIN` role to ALL menu items
- Kept `ADMIN` role only for allowed items:
  - Dashboard
  - Content Management
  - Subscriptions
  - Products
  - Study
  - Test Creation
  - Administration
  - Assessments
- Removed `ADMIN` role from restricted items:
  - Misc
  - Messages
  - Payments
  - Development

### 2. Admin Page Access
**File**: `frontend-next/pages/admin.tsx`

- Updated to allow both `ADMIN` and `SUPERADMIN` roles
- Changed from: `userRoles.includes("ADMIN")`
- Changed to: `userRoles.includes("ADMIN") || userRoles.includes("SUPERADMIN")`

### 3. Backend Role Guard
**File**: `backend/src/modules/auth/guards/roles.guard.ts`

- Updated to treat `SUPERADMIN` as having all roles
- SUPERADMIN automatically passes any role check

### 4. SUPERADMIN Role Creation
**File**: `backend/scripts/create-superadmin-user.ts`

- Script to create SUPERADMIN role in database
- Script to create superadmin user account

## Creating SuperAdmin User

### On Server

```bash
cd ~/deployments/clinical-lab/backend
npm run create:superadmin
```

### Credentials
- **Email**: `superadmin@uber.com`
- **Password**: `password123`
- **Role**: `SUPERADMIN`

## Creating Admin User

### On Server

```bash
cd ~/deployments/clinical-lab/backend
npm run create:admin
```

### Credentials
- **Email**: `tahir@uber.com`
- **Password**: `password123`
- **Role**: `ADMIN`

## Menu Items Details

### Allowed for ADMIN:
1. **Dashboard** - `/test-creation/new`
2. **Content Management** - `/admin/content`
   - Sections
   - Chapters
   - Topics
   - Questions
   - Question Choices
3. **Subscriptions** - `/admin/subscriptions`
   - Subscriptions List
   - Subscription Packages
   - Package Features
4. **Products** - `/admin/products`
   - Products List
   - Product Tags
   - Product Subtypes
5. **Study** - `/study`
   - Question Bank
   - Study Materials
   - Flashcards
   - Notes
6. **Test Creation** - `/test-creation`
   - Study Create Test
   - Previous Tests
   - Test Templates
   - Question Builder
   - New Question Builder
   - Test Settings
7. **Administration** - `/admin`
   - Users
   - Roles
   - System Settings
   - Tables
8. **Assessments** - `/admin/assessments`
   - Question Papers
   - Question Paper Questions

### Hidden from ADMIN (SUPERADMIN only):
1. **Misc** - `/med-app`
   - Zoom Simulation
   - Robotic
   - Question Generator
2. **Messages** - `/chat`
   - Chat Rooms
   - Support
   - Notifications
3. **Payments** - `/payments`
   - Payment History
   - Payment Methods
   - Payouts
   - Invoices
4. **Development** - `/development`
   - Menu Manager
   - Ref Design
   - Advanced DB Viewer
   - Org Chart

## Testing

### Test SUPERADMIN Access
1. Login as `superadmin@uber.com` / `password123`
2. Verify all menu items are visible
3. Verify can access all pages

### Test ADMIN Access
1. Login as `tahir@uber.com` / `password123`
2. Verify only allowed menu items are visible
3. Verify restricted items (Misc, Messages, Payments, Development) are hidden
4. Verify can access all allowed pages

## Backend API Access

The backend `RolesGuard` has been updated to:
- Allow SUPERADMIN to access any endpoint (bypasses role checks)
- Require ADMIN role for admin-only endpoints
- All existing `@Roles('ADMIN')` decorators will work for both ADMIN and SUPERADMIN

## Notes

- Menu filtering happens in `getMenuItemsForRole()` function in `menu.ts`
- The menu system automatically filters items based on user roles
- SUPERADMIN role is treated as having all permissions in backend guards
- Both roles can access the admin page (`/admin`)

