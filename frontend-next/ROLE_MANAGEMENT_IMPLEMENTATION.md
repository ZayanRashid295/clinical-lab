# Role Management Implementation

## Overview

This document describes the implementation of Role Management functionality in the frontend-next application, mirroring the User Management functionality.

## Files Created

### 1. Type Definitions

**File:** `src/app/types/user.ts`

- Added `RoleQueryParams` interface for role query parameters
- Added `CreateRoleDto` interface for creating roles
- Added `UpdateRoleDto` interface for updating roles
- Added `RoleFilters` interface for filtering roles

### 2. Services

**Files:**

- `src/app/services/roles/roles.service.ts` - Roles API service
- `src/app/services/roles/roles.types.ts` - Role service types

**Features:**

- `getRoles()` - Fetch roles with pagination and filtering
- `getRole(id)` - Get a specific role by ID
- `createRole(data)` - Create a new role
- `updateRole(id, data)` - Update an existing role
- `delete(id)` (inherited) - Soft-delete / mark role inactive
- `getRoleStats()` - Get role statistics

### 3. Hooks

**Files:**

- `src/hooks/useRoles.ts` - Hook for managing roles data
- `src/hooks/useRoleStats.ts` - Hook for managing role statistics

**Features:**

- Data fetching with pagination
- Filter management
- Loading and error states
- Refetch capability

### 4. Components

**Files:**

- `src/app/components/Roles/RolesTable.tsx` - Table view for roles
- `src/app/components/Roles/RoleFilters.tsx` - Filter component
- `src/app/components/Roles/RoleFormModal.tsx` - Create/Edit modal
- `src/app/components/Roles/RoleViewModal.tsx` - View details modal

**Features:**

- **RolesTable:**
  - Sortable columns (Name, Display Name, Created Date)
  - Loading and empty states
  - Action buttons (View, Edit)
  - Responsive design
- **RoleFilters:**
  - Status filter (Active/Inactive)
  - Date range filters
  - Clear filters functionality
  - Active filters display
- **RoleFormModal:**
  - Create and Edit modes
  - Permission selection with checkboxes
  - Form validation
  - Success/Error messaging
- **RoleViewModal:**
  - Detailed role information
  - Permission list
  - Metadata display

### 5. Main Content Component

**File:** `src/app/components/Content/RoleManagementContent.tsx`

**Features:**

- **Summary Statistics:**
  - Total Roles
  - Active Roles
  - Inactive Roles
  - Total Users (with roles)
- **View Modes:**
  - Table View
  - Card/Tile View
- **Search & Filtering:**
  - Search by role name, display name, or description
  - Status filter
  - Date range filters
  - Show/Hide filters toggle
- **Sorting:**
  - Sort by Name, Display Name, Created Date
  - Ascending/Descending order
  - Visual indicators
- **Pagination:**
  - Page navigation
  - Page size selection (5, 10, 25, 50)
  - Shows current range and total count
- **Actions:**
  - Create Role
  - View Role Details
  - Edit Role
  - Set inactive via edit (isActive)
  - Refresh Data

## Features Implemented

### ✅ Sorting

- Sortable columns in table view
- Visual indicators for sort direction
- Sort by: Name, Display Name, Created Date

### ✅ Searching

- Search by role name, display name, or description
- Real-time search filtering
- Search input with icon

### ✅ Filtering

- Status filter (Active/Inactive)
- Date range filters (Date From, Date To)
- Active filters display with remove capability
- Clear all filters button

### ✅ Table/Tile View

- Toggle between table and card views
- Table view: Compact data display with sortable columns
- Card view: Visual cards with role information and permissions

### ✅ Pagination

- Server-side pagination
- Page size selection
- Page navigation with prev/next buttons
- Page number display with ellipsis for large page counts

### ✅ CRUD Operations

- Create new roles with permissions
- View role details
- Edit existing roles
- Mark roles inactive via edit (isActive)

### ✅ Loading States

- Loading overlay for both views
- Spinner animations
- Loading text

### ✅ Error Handling

- Error message display
- Graceful error handling
- Error recovery

## UI/UX Features

1. **Responsive Design:** Works on mobile, tablet, and desktop
2. **Consistent Styling:** Matches User Management design
3. **Loading States:** Visual feedback during data fetching
4. **Empty States:** Helpful messages when no data is found
5. **Accessibility:** Proper labels and keyboard navigation
6. **Visual Feedback:** Hover effects, transitions, and animations

## API Integration

The implementation uses the same BaseApiService pattern as User Management:

- Consistent error handling
- Authentication token management
- Request/response parsing
- Type-safe API calls

## Permission Management

The implementation includes a comprehensive permission system:

- Predefined permission categories
- Easy permission selection via checkboxes
- Visual permission display
- Permission count tracking

## Next Steps

To complete the implementation, you may want to:

1. Implement backend API endpoints for roles
2. Add role-user assignment functionality
3. Implement role deactivation logic
4. Add permission inheritance
5. Add role usage statistics
6. Implement role cloning functionality

## Usage

The Role Management component is ready to use in your admin panel. Simply import and use:

```tsx
import RoleManagementContent from "@/app/components/Content/RoleManagementContent";

// In your page/component
<RoleManagementContent />;
```

The component handles all data fetching, state management, and user interactions internally.
