# Shared Components and Services

This folder contains reusable components, services, and utilities that can be shared across different applications.

## Structure

```
shared/
├── components/          # Reusable UI components
│   ├── MenuSystem.tsx  # Main menu system orchestrator
│   ├── Navigation/     # Navigation components (Sidebar)
│   ├── Layout/         # Layout components (Header)
│   ├── Common/         # Shared utilities (IconMap)
│   └── index.ts        # Component exports
├── services/           # Shared services (auth, API, etc.)
├── types/             # Shared TypeScript types and configurations
├── utils/             # Utility functions
└── index.ts           # Main exports
```

## Application-Specific Structure

```
src/components/
├── Dashboard/          # Application-specific dashboard components
│   ├── StatsCards.tsx  # Customizable stats display
│   ├── RecentAlerts.tsx # Alert notifications
│   ├── DataTable.tsx   # Generic data table
│   ├── GenericDashboardContent.tsx # Reusable dashboard component
│   └── RideSharingDashboardContent.tsx # Main ride-sharing dashboard
└── UberDashboard.tsx   # Uber-specific dashboard implementation
```

## Components

### MenuSystem (Shared)

A highly configurable dashboard menu system that provides:

- Navigation sidebar with role-based menu items
- Header with search and user information
- Customizable content areas
- Application-agnostic design

### Dashboard Components (Application-Specific)

- **DataTable**: Generic table component with custom columns and actions
- **StatsCards**: Configurable statistics cards
- **RecentAlerts**: Alert notification display
- **GenericDashboardContent**: Reusable dashboard component with customizable props
- **RideSharingDashboardContent**: Main ride-sharing dashboard with real data integration

## Services

### AuthService

Handles user authentication, login/logout, and session management.

### ApiService

Provides HTTP client functionality for API calls.

## Usage

```typescript
// Import from shared
import { MenuSystem, authService } from "../shared";

// Import application-specific components
import DataTable from "./Dashboard/DataTable";
import StatsCards from "./Dashboard/StatsCards";

// Use MenuSystem with custom dashboard
<MenuSystem
  applicationTitle="Your App"
  customContent={{
    dashboard: YourCustomDashboard,
  }}
/>;
```

## Guidelines

- **Shared folder**: Only truly reusable, application-agnostic components
- **Components folder**: Application-specific implementations
- No ride-specific, patient-specific, or domain-specific code in shared
- All shared components should be well-documented and typed
- Consider backwards compatibility when making changes
