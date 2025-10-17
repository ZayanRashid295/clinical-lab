# Generic MenuSystem Component

The MenuSystem component has been refactored to be completely generic and configurable, removing all application-specific code.

## Key Changes

### 1. Removed Application-Specific Code

- Removed hardcoded content mapping in `getContentForPath`
- Removed inline admin dashboard content
- Removed inline analytics dashboard content
- Removed specific component imports

### 2. New Generic Architecture

#### Content Configuration System

- **ContentConfig**: Maps paths to React components
- **DashboardConfig**: Configuration for dashboard layouts with stats, quick actions, and activity
- **ContentRegistry**: Combines content and dashboard configurations

#### New Components

- **ContentRenderer**: Generic component that renders content based on configuration
- **DashboardRenderer**: Renders dashboards from configuration objects
- **Content Registry**: Centralized configuration system

## Usage

### Basic Usage with Default Content

```tsx
import { MenuSystem } from "../shared/components/MenuSystem";

function App() {
  return <MenuSystem customDashboard={MyDashboard} applicationTitle="My App" />;
}
```

### Advanced Usage with Custom Content Registry

```tsx
import { MenuSystem } from "../shared/components/MenuSystem";
import { createContentRegistry } from "../../app/config/content.registry";

const myContentRegistry = createContentRegistry({
  content: {
    "/my-page": () => <MyCustomComponent />,
    "/another-page": () => <AnotherComponent />,
  },
  dashboards: {
    "/admin": {
      title: "Admin Dashboard",
      description: "System administration",
      stats: [{ label: "Users", value: "100", icon: "👥", color: "blue" }],
      quickActions: [
        {
          title: "Manage Users",
          description: "User management",
          icon: "👥",
          color: "blue",
        },
      ],
    },
  },
});

function App() {
  return (
    <MenuSystem
      contentRegistry={myContentRegistry}
      customDashboard={MyDashboard}
      applicationTitle="My App"
    />
  );
}
```

### Using Pre-configured Registries

```tsx
import { MenuSystem } from "../shared/components/MenuSystem";
import { rideSharingContentRegistry } from "../shared/examples/ride-sharing-content.registry";

function App() {
  return (
    <MenuSystem
      contentRegistry={rideSharingContentRegistry}
      customDashboard={RideSharingDashboard}
      applicationTitle="Ride Sharing App"
    />
  );
}
```

## Configuration Options

### ContentConfig

Maps URL paths to React components:

```tsx
const content: ContentConfig = {
  "/users": () => <UserManagement />,
  "/settings": () => <SettingsPage />,
  "/reports": () => <ReportsPage />,
};
```

### DashboardConfig

Configures dashboard layouts:

```tsx
const dashboard: DashboardConfig = {
  title: "Dashboard Title",
  description: "Dashboard description",
  stats: [
    {
      label: "Total Users",
      value: "1,234",
      icon: "👥",
      color: "blue",
    },
  ],
  quickActions: [
    {
      title: "Add User",
      description: "Create new user account",
      icon: "➕",
      color: "green",
      onClick: () => console.log("Add user clicked"),
    },
  ],
  recentActivity: [
    {
      type: "success",
      message: "User created successfully",
      timestamp: "2 hours ago",
    },
  ],
};
```

### ContentRegistry

Combines all configurations:

```tsx
const registry = createContentRegistry({
  content: myContent,
  dashboards: myDashboards,
  defaultContent: () => <DefaultPage />,
});
```

## Migration Guide

### From Old MenuSystem

1. **Extract your content components** from the old `getContentForPath` function
2. **Create a content registry** with your components
3. **Pass the registry** to the MenuSystem component
4. **Remove application-specific imports** from MenuSystem

### Example Migration

```tsx
// Old way (hardcoded in MenuSystem)
case "/users":
  return <UserManagement />;

// New way (in your content registry)
const contentRegistry = createContentRegistry({
  content: {
    '/users': () => <UserManagement />
  }
});

<MenuSystem contentRegistry={contentRegistry} />
```

## Benefits

1. **Reusability**: MenuSystem can be used in any application
2. **Maintainability**: Application-specific code is separated
3. **Flexibility**: Easy to configure different content for different applications
4. **Testability**: Components can be tested independently
5. **Scalability**: Easy to add new content without modifying core MenuSystem

## File Structure

```
src/shared/
├── components/
│   ├── MenuSystem/
│   │   ├── MenuSystem.tsx (generic)
│   │   └── README.md
│   ├── Content/
│   │   └── ContentRenderer.tsx
│   └── Dashboard/
│       └── DashboardRenderer.tsx
├── config/
│   ├── content.registry.tsx
│   └── dashboard.configs.ts
├── examples/
│   └── ride-sharing-content.registry.tsx
└── types/
    └── content.config.ts
```
