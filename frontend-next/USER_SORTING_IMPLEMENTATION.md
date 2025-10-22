# User Sorting Implementation - Status and Role

## Overview

Implemented sorting functionality for **Status** and **Role** columns in the User Management module, both at the frontend and backend levels.

## Changes Made

### Frontend Changes

#### 1. Type Definitions

**File:** `src/app/types/user.ts`

Added `isActive` and `role` to the sortable fields:

```typescript
export interface UserQueryParams {
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "firstName"
    | "lastName"
    | "email"
    | "isActive"
    | "role";
  // ...
}
```

#### 2. UsersTable Component

**File:** `src/app/components/Users/UsersTable.tsx`

Added sorting functionality to Role and Status column headers:

- Made columns clickable with hover effect
- Added sort icons to show current sort state
- Implemented sort handlers for "role" and "isActive"

**Before:**

```tsx
<th className="...">Role</th>
<th className="...">Status</th>
```

**After:**

```tsx
<th className="... cursor-pointer hover:bg-gray-100" onClick={() => handleSort("role")}>
  <div className="flex items-center">
    Role
    {getSortIcon("role")}
  </div>
</th>
<th className="... cursor-pointer hover:bg-gray-100" onClick={() => handleSort("isActive")}>
  <div className="flex items-center">
    Status
    {getSortIcon("isActive")}
  </div>
</th>
```

### Backend Changes

#### 1. Query DTO

**File:** `src/modules/users/dto/query-user.dto.ts`

Added `isActive` and `role` to the sortBy enum:

```typescript
@IsEnum(["createdAt", "updatedAt", "firstName", "lastName", "email", "isActive", "role"])
sortBy?: "createdAt" | "updatedAt" | "firstName" | "lastName" | "email" | "isActive" | "role" = "createdAt";
```

#### 2. Users Service

**File:** `src/modules/users/users.service.ts`

Implemented special handling for sorting:

**Status Sorting (isActive):**

- Direct Prisma sorting by the `isActive` boolean field
- Works efficiently at the database level

**Role Sorting:**

- Application-level sorting since role is stored in a junction table
- Fetches all users, sorts by role name, then applies pagination
- Uses localeCompare for proper string comparison

```typescript
if (sortBy === "role") {
  needsApplicationSorting = true;
  orderBy = undefined;
} else if (sortBy === "isActive") {
  orderBy = {
    isActive: sortOrder,
  };
} else {
  orderBy = {
    [sortBy]: sortOrder,
  };
}

// Handle role sorting at application level
if (needsApplicationSorting) {
  users = users.sort((a, b) => {
    const roleA = a.roles?.[0]?.role?.name || "";
    const roleB = b.roles?.[0]?.role?.name || "";

    if (sortOrder === "asc") {
      return roleA.localeCompare(roleB);
    } else {
      return roleB.localeCompare(roleA);
    }
  });

  users = users.slice(skip, skip + limit);
}
```

## Features

### Status Sorting

- **Ascending:** Inactive users appear first, then Active users
- **Descending:** Active users appear first, then Inactive users
- Efficient database-level sorting

### Role Sorting

- **Ascending:** Alphabetical order (ADMIN, CUSTOMER_SUPPORT, DRIVER, FLEET_MANAGER)
- **Descending:** Reverse alphabetical order
- Uses the first role associated with each user
- Application-level sorting due to junction table relationship

## User Experience

1. **Visual Feedback:**

   - Sortable columns show a cursor pointer on hover
   - Hover effect with background color change
   - Sort icons indicate current sort state and direction

2. **Interaction:**

   - Click column header to sort
   - Click again to toggle sort order (asc ↔ desc)
   - Works with existing filters and pagination

3. **Consistency:**
   - Matches existing sorting behavior for other columns
   - Same visual style and interaction pattern

## Technical Considerations

### Role Sorting Performance

Role sorting requires application-level sorting because:

- Users can have multiple roles (junction table)
- Prisma doesn't natively support sorting by nested relation data
- We use the first role name for sorting

**Note:** For large datasets, consider:

- Caching sorted results
- Adding a computed column for the primary role
- Using database views or materialized tables

### Status Sorting

Status sorting is highly efficient:

- Direct boolean field sorting
- Database-level operation
- No performance concerns

## Testing

To test the sorting:

1. **Status Sorting:**

   - Click the "Status" column header
   - Verify users are sorted by active/inactive state
   - Click again to reverse the order

2. **Role Sorting:**

   - Click the "Role" column header
   - Verify users are sorted alphabetically by role name
   - Click again to reverse the order

3. **Combined with Filters:**

   - Apply filters (e.g., search, status filter)
   - Sort by role or status
   - Verify sorting works correctly with filtered data

4. **Combined with Pagination:**
   - Navigate to different pages
   - Apply sorting
   - Verify sort persists across pages

## Backend API

The API now accepts `sortBy` parameter with these values:

```
sortBy: "createdAt" | "updatedAt" | "firstName" | "lastName" | "email" | "isActive" | "role"
sortOrder: "asc" | "desc"
```

Example request:

```
GET /users?sortBy=isActive&sortOrder=asc
GET /users?sortBy=role&sortOrder=desc
```

## Summary

Successfully implemented sorting for Status and Role columns with:

- ✅ Frontend UI updates with sort icons
- ✅ Backend DTO validation
- ✅ Special sorting logic for junction table data
- ✅ Database-level sorting for status field
- ✅ Application-level sorting for role field
- ✅ Consistent user experience
- ✅ No linting errors
