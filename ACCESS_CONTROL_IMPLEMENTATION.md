# RBAC + Subscription-Based Access Control Implementation

## Overview
This document describes the complete implementation of Role-Based Access Control (RBAC) and Subscription-Based Access Control for the Clinical Lab application.

## Architecture

### Backend Implementation

#### 1. Guards (NestJS)
Located in `backend/src/modules/auth/guards/`:

- **RolesGuard**: Checks if user has required role(s)
- **PermissionsGuard**: Checks if user has required permission(s)
- **SubscriptionGuard**: Checks if user has active subscription
- **FeatureGuard**: Checks if user's subscription includes required feature(s)
- **CombinedAccessGuard**: Combines all guards for complex access requirements

#### 2. Decorators
Located in `backend/src/modules/auth/decorators/`:

- `@Roles('ADMIN', 'STUDENT')` - Require specific roles
- `@Permissions('user:read', 'question:create')` - Require specific permissions
- `@RequireActiveSubscription()` - Require active subscription
- `@RequiredFeatures('Qbank Access', 'Self Assessment')` - Require subscription features

#### 3. Service Methods

**AuthService** (`backend/src/modules/auth/auth.service.ts`):
- `getUserWithAccess(userId)`: Get user with roles and permissions
- `userHasPermission(userId, permission)`: Check if user has permission
- `userHasRole(userId, role)`: Check if user has role

**SubscriptionsService** (`backend/src/modules/subscriptions/subscriptions.service.ts`):
- `getUserActiveFeatures(userId)`: Get all active features for user
- `userHasFeature(userId, featureName)`: Check if user has specific feature
- `getUserActiveSubscriptionWithFeatures(userId)`: Get active subscription with features

#### 4. JWT Strategy
Updated to include roles and permissions in JWT payload:
```typescript
{
  userId: string,
  email: string,
  roles: string[],
  permissions: string[]
}
```

### Frontend Implementation

#### 1. Hooks
**useAccessControl** (`frontend-next/src/hooks/useAccessControl.ts`):
- Provides access control state and methods
- Automatically loads user roles, permissions, and subscription features
- Methods:
  - `hasRole(role)`: Check if user has role
  - `hasPermission(permission)`: Check if user has permission
  - `hasFeature(feature)`: Check if user has subscription feature
  - `hasActiveSubscription`: Check if user has active subscription
  - `canAccess(requirements)`: Check multiple requirements

#### 2. Components
**ProtectedRoute** (`frontend-next/src/components/ProtectedRoute.tsx`):
- Wraps pages/routes that require access control
- Shows appropriate error messages for access denied
- Supports redirects and custom fallbacks

**ConditionalRender** (`frontend-next/src/components/ConditionalRender.tsx`):
- `IfRole`: Render based on role
- `IfPermission`: Render based on permission
- `IfFeature`: Render based on subscription feature
- `IfSubscription`: Render based on subscription status
- `IfAdmin`, `IfStudent`, `IfQbankAccess`: Convenience components

## Access Control Matrix

| Resource | Admin | Student (No Sub) | Student (Basic) | Student (Premium) | InstitutionManager |
|----------|-------|------------------|------------------|-------------------|-------------------|
| Dashboard | ✅ Full | ⚠️ Limited | ✅ Full | ✅ Full | ✅ Full |
| Qbank Questions | ✅ All | ❌ None | ✅ Limited | ✅ All | ✅ All |
| Self Assessment | ✅ All | ❌ None | ❌ None | ✅ 1/month | ✅ All |
| Create Question | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| Manage Users | ✅ Yes | ❌ No | ❌ No | ❌ No | ⚠️ Institution Only |
| Study Planner | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Flashcards | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes |

## Protected Endpoints

### Questions Endpoints
- `GET /questions` - Requires "Qbank Access" feature
- `GET /questions/stats` - Requires "Qbank Access" feature
- `GET /questions/random` - Requires "Qbank Access" feature
- `GET /questions/:id` - Requires "Qbank Access" feature
- `POST /questions` - Requires ADMIN role
- `PATCH /questions/:id` - Requires ADMIN role
- `DELETE /questions/:id` - Requires ADMIN role

### Assessment Endpoints
- `GET /assessments` - Requires active subscription
- `POST /assessments` - Requires active subscription
- `POST /assessments/:id/start` - Requires active subscription

## Database Indexes

Optimized indexes for access control queries:
- `idx_user_roles_user_id`: Fast role lookup
- `idx_user_permissions_user_id`: Fast permission lookup
- `idx_subscriptions_user_id_status`: Fast subscription lookup
- `idx_subscriptions_active_lookup`: Optimized active subscription queries

## Usage Examples

### Backend
```typescript
// Require Qbank Access feature
@Get('questions')
@UseGuards(JwtAuthGuard, FeatureGuard)
@RequiredFeatures('Qbank Access')
async getQuestions() { }

// Require ADMIN role
@Post('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
async createQuestion() { }

// Require active subscription
@Post('assessments')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequireActiveSubscription()
async createAssessment() { }

// Combined requirements
@Post('question-papers')
@UseGuards(JwtAuthGuard, CombinedAccessGuard)
@Roles('STUDENT')
@RequireActiveSubscription()
@RequiredFeatures('Qbank Access')
async createQuestionPaper() { }
```

### Frontend
```typescript
// Protect a route
<ProtectedRoute requireSubscription={true}>
  <Dashboard />
</ProtectedRoute>

// Conditional rendering
<IfFeature feature="Qbank Access">
  <QbankButton />
</IfFeature>

<IfRole role="ADMIN">
  <AdminPanel />
</IfRole>

// Using hook
const { hasFeature, canAccess } = useAccessControl();
if (canAccess({ feature: 'Qbank Access', requireSubscription: true })) {
  // Show content
}
```

## Security Considerations

1. **JWT Token**: Roles and permissions are included in JWT for fast access checks
2. **Backend Validation**: All access checks are validated on the backend
3. **Database Transactions**: Subscription updates use transactions to prevent race conditions
4. **Index Optimization**: Database indexes ensure fast access control queries
5. **Error Handling**: Proper error messages guide users to upgrade when needed

## Testing Checklist

- [ ] Admin can access all endpoints
- [ ] Student without subscription cannot access protected features
- [ ] Student with Basic subscription can access Qbank only
- [ ] Student with Premium subscription can access all features
- [ ] Frontend shows/hides features based on subscription
- [ ] Backend guards properly reject unauthorized requests
- [ ] JWT token includes roles and permissions
- [ ] Database indexes improve query performance

## Migration Notes

1. Run database migration to add indexes:
   ```sql
   -- See backend/prisma/migrations/add_access_control_indexes.sql
   ```

2. Update existing users with roles (if needed):
   ```typescript
   // Assign default STUDENT role to existing users
   ```

3. Test all protected endpoints after deployment

## Future Enhancements

- [ ] Rate limiting based on subscription tier
- [ ] Feature usage tracking
- [ ] Subscription upgrade prompts
- [ ] Audit logging for access denials
- [ ] Caching layer for access control checks




