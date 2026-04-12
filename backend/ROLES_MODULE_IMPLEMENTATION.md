# Roles Module Backend Implementation

## Overview

This document describes the backend implementation of the Roles module in the NestJS application, providing CRUD operations for role management with permission handling.

## Files Created

### 1. DTOs (Data Transfer Objects)

**Files:**

- `src/modules/roles/dto/create-role.dto.ts` - DTO for creating roles
- `src/modules/roles/dto/update-role.dto.ts` - DTO for updating roles
- `src/modules/roles/dto/query-role.dto.ts` - DTO for querying roles with filters

**Features:**

- Validation decorators using class-validator
- Swagger documentation with @ApiProperty
- Support for permissions array
- Status filtering (ACTIVE/INACTIVE)
- Pagination and sorting parameters

### 2. Service

**File:** `src/modules/roles/roles.service.ts`

**Methods:**

1. **findAll(query)** - Get all roles with filtering, pagination, and sorting
   - Supports search by name, displayName, or description
   - Supports status filtering
   - Supports date range filtering
   - Returns paginated results
   - Transforms permissions from junction table to string array

2. **findOne(id)** - Get a single role by ID
   - Includes permissions
   - Transforms permissions to string array

3. **create(createRoleDto)** - Create a new role
   - Validates role name uniqueness
   - Creates permissions if they don't exist
   - Links permissions to role via junction table
   - Returns role with permissions as string array

4. **update(id, updateRoleDto)** - Update an existing role
   - Updates role fields
   - Handles permission updates by replacing all permissions
   - Creates new permissions if needed
   - Returns updated role with permissions

5. **remove(id)** - Mark role inactive (soft delete)
   - Sets isActive to false

6. **getStats()** - Get role statistics
   - Returns total, active, and inactive counts

### 3. Controller

**File:** `src/modules/roles/roles.controller.ts`

**Endpoints:**

- `GET /roles` - Get all roles with query parameters
- `GET /roles/stats` - Get role statistics
- `POST /roles` - Create a new role
- `GET /roles/:id` - Get role by ID
- `PATCH /roles/:id` - Update role
- `DELETE /roles/:id` - Mark role inactive

**Features:**

- Protected with JWT authentication
- Swagger documentation
- Input validation
- Error handling

### 4. Module

**File:** `src/modules/roles/roles.module.ts`

- Registers RolesController and RolesService
- Exports RolesService for use in other modules

### 5. Database Schema Updates

**File:** `prisma/schema/base.schema.prisma`

Added `displayName` field to Role model:

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  displayName String?  // NEW FIELD
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}
```

**Migration:** `20251022071657_add_display_name_to_role`

### 6. App Module Registration

**File:** `src/app.module.ts`

- Added RolesModule import
- Registered RolesModule in imports array

## Permission Handling

The implementation handles permissions through a junction table (`RolePermission`):

1. **Creating Roles**: Accepts permissions as string array, creates permissions if they don't exist, and links them via the junction table
2. **Reading Roles**: Transforms junction table data to string array format for frontend consumption
3. **Updating Roles**: Replaces all permissions (delete existing, create new)
4. **Auto-creation**: Permissions are automatically created if they don't exist in the database

## API Features

### Query Parameters (GET /roles)

- `search` - Search by name, displayName, or description
- `status` - Filter by ACTIVE or INACTIVE
- `dateFrom` - Filter roles created from this date
- `dateTo` - Filter roles created until this date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by (createdAt, updatedAt, name, displayName)
- `sortOrder` - Sort order (asc, desc)

### Request/Response Format

**Create Role Request:**

```json
{
  "name": "ADMIN",
  "displayName": "Administrator",
  "description": "Full system access",
  "permissions": ["USER_MANAGEMENT", "ROLE_MANAGEMENT"],
  "isActive": true
}
```

**Role Response:**

```json
{
  "id": "clx...",
  "name": "ADMIN",
  "displayName": "Administrator",
  "description": "Full system access",
  "isActive": true,
  "permissions": ["USER_MANAGEMENT", "ROLE_MANAGEMENT"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Paginated Response:**

```json
{
  "data": [...roles],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

## Security

- All endpoints are protected with JWT authentication
- Bearer token required in Authorization header
- User must be authenticated to access role endpoints

## Testing

To test the endpoints:

1. Start the backend server
2. Authenticate to get JWT token
3. Use the token in Authorization header
4. Test each endpoint with appropriate payloads

## Database Migration

The migration has been created and applied:

```bash
npx prisma migrate dev --name add_display_name_to_role
```

## Next Steps

To complete the implementation:

1. Add role assignment functionality for users
2. Implement permission checking middleware
3. Add role-based access control (RBAC)
4. Add audit logging for role changes
5. Implement role cloning functionality
6. Add bulk operations for roles
