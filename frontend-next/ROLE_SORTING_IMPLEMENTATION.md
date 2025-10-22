# Role Status Sorting Implementation

## Overview

Added status sorting functionality to the Role Management module, both at the frontend and backend levels.

## Changes Made

### Frontend Changes

#### 1. Type Definitions

**File:** `src/app/types/user.ts`

Added `isActive` to the sortable fields:

```typescript
export interface RoleQueryParams {
  sortBy?: "createdAt" | "updatedAt" | "name" | "displayName" | "isActive";
  // ...
}
```

#### 2. RolesTable Component

**File:** `src/app/components/Roles/RolesTable.tsx`

Made the Status column sortable:

```tsx
<th
  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
  onClick={() => handleSort("isActive")}
>
  <div className="flex items-center">
    Status
    {getSortIcon("isActive")}
  </div>
</th>
```

### Backend Changes

#### 1. Query DTO

**File:** `src/modules/roles/dto/query-role.dto.ts`

Added `isActive` to the sortBy enum:

```typescript
@IsEnum(["createdAt", "updatedAt", "name", "displayName", "isActive"])
sortBy?: "createdAt" | "updatedAt" | "name" | "displayName" | "isActive" = "createdAt";
```

#### 2. Roles Service

**File:** `src/modules/roles/roles.service.ts`

Implemented sorting by `isActive` field:

```typescript
if (sortBy === "isActive") {
  orderBy = {
    isActive: sortOrder,
  };
} else {
  orderBy = {
    [sortBy]: sortOrder,
  };
}
```

## Features

### Status Sorting

- **Ascending:** Inactive roles appear first, then Active roles
- **Descending:** Active roles appear first, then Inactive roles
- Efficient database-level sorting using boolean field

## User Experience

1. **Visual Feedback:**

   - Status column shows cursor pointer on hover
   - Hover effect with background color change
   - Sort icons indicate current sort state and direction

2. **Interaction:**

   - Click Status column header to sort
   - Click again to toggle sort order (asc ↔ desc)
   - Works with existing filters and pagination

3. **Consistency:**
   - Matches User Management sorting behavior
   - Same visual style and interaction pattern

## Summary

Successfully implemented status sorting for roles with:

- ✅ Frontend UI updates with sort icons
- ✅ Backend DTO validation
- ✅ Database-level sorting for status field
- ✅ Consistent user experience
- ✅ No linting errors
