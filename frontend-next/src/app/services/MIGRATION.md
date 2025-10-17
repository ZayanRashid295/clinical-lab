# API Services Migration Guide

This document outlines the migration from the monolithic `api.service.ts` to modular services.

## ✅ Completed Services

### 1. Base Service

- `services/base/base-api.service.ts` - Common HTTP functionality
- `services/base/api-types.ts` - Common API types

### 2. Auth Service

- `services/auth/auth.service.ts` - Authentication operations
- `services/auth/auth.types.ts` - Auth-specific types

### 3. Rides Service

- `services/rides/rides.service.ts` - Ride operations
- `services/rides/rides.types.ts` - Ride-specific types

### 4. Payments Service

- `services/payments/payments.service.ts` - Payment operations
- `services/payments/payments.types.ts` - Payment-specific types

## 🔄 Migration Status

### Updated Components/Hooks:

- ✅ `hooks/useRides.ts` - Now uses `ridesService`
- ✅ `shared/services/auth.service.ts` - Now uses `authService`

### Pending Updates:

- [ ] Payment-related hooks and components
- [ ] Other hooks using the old `apiService`

## 📦 How to Import

### New Modular Way (Recommended):

```typescript
// Import specific services
import { ridesService } from "../services/rides/rides.service";
import { authService } from "../services/auth/auth.service";
import { paymentsService } from "../services/payments/payments.service";

// Or use barrel exports
import { ridesService, authService, paymentsService } from "../services";

// Or use the api object
import { api } from "../services";
const rides = await api.rides.getRides();
```

### Old Monolithic Way (Being Phased Out):

```typescript
import { apiService } from "../shared/services/api.service";
const rides = await apiService.getRides();
```

## 🚀 Benefits of Modular Services

1. **Single Responsibility**: Each service handles one domain
2. **Better Testing**: Test each service independently
3. **Easier Maintenance**: Find and modify specific functionality quickly
4. **Team Collaboration**: Multiple developers can work on different modules
5. **Type Safety**: Domain-specific types for better development experience
6. **Tree Shaking**: Import only what you need

## 🔧 Remaining Services to Extract

- [ ] Payouts Service (`/payouts/*`)
- [ ] Fleet Service (`/fleet/*`)
- [ ] Locations Service (`/locations/*`)
- [ ] Chat Service (`/chat/*`)
- [ ] Notifications Service (`/notifications/*`)
- [ ] Admin Service (`/admin/*`)
- [ ] Users Service (`/users/*`)

## 📝 Migration Checklist

When migrating a component/hook:

1. [ ] Identify which service methods are used
2. [ ] Replace imports with modular service imports
3. [ ] Update method calls to use new service
4. [ ] Test the functionality works correctly
5. [ ] Update any TypeScript types if needed
6. [ ] Remove unused imports from old `apiService`

## 🔍 Finding Components to Migrate

Search for files that import the old service:

```bash
grep -r "apiService" src/ --include="*.ts" --include="*.tsx"
```

## 🎯 Next Steps

1. Extract remaining services one by one
2. Update all components/hooks to use modular services
3. Remove the monolithic `api.service.ts` file
4. Update documentation and examples
