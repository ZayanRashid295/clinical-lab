import { ContentRegistry } from "../types/dashboard";

// Import ride-sharing specific components
import { RideManagement } from "../components/Rides";
import PaymentHistoryContent from "../components/Content/PaymentHistoryContent";
import PaymentMethodsContent from "../components/Content/PaymentMethodsContent";
import PayoutsContent from "../components/Content/PayoutsContent";
import InvoicesContent from "../components/Content/InvoicesContent";
import ChatRoomsList from "../components/Chat/ChatRoomsList";
import SupportChatRoomsList from "../components/Chat/SupportChatRoomsList";
import NotificationsList from "../components/Notifications/NotificationsList";
import LocationsOverview from "../components/Locations/LocationsOverview";
import PickupLocationsList from "../components/Locations/PickupLocationsList";
import DropoffLocationsList from "../components/Locations/DropoffLocationsList";
import FavoriteLocationsList from "../components/Locations/FavoriteLocationsList";
import LocationAnalytics from "../components/Locations/LocationAnalytics";
import FleetManagementContent from "../components/Content/FleetManagementContent";
import VehiclesContent from "../components/Content/VehiclesContent";
import DriversContent from "../components/Content/DriversContent";
import RoutesContent from "../components/Content/RoutesContent";
import MaintenanceContent from "../components/Content/MaintenanceContent";
import FuelContent from "../components/Content/FuelContent";
import UserManagementContent from "../components/Content/UserManagementContent";
import RoleManagementContent from "../components/Content/RoleManagementContent";
import SystemSettingsContent from "../components/Content/SystemSettingsContent";
import ReportsContent from "../components/Content/ReportsContent";
import AuditLogsContent from "../components/Content/AuditLogsContent";
import {
  mainDashboardConfig,
  adminDashboardConfig,
  analyticsDashboardConfig,
  paymentAnalyticsConfig,
} from "./dashboard.configs";

// Ride-sharing specific content registry
export const rideSharingContentRegistry: ContentRegistry = {
  content: {
    // Ride management routes
    "/rides": () => <RideManagement mode="all" />,
    "/rides/history": () => <RideManagement mode="history" />,
    "/rides/active": () => <RideManagement mode="active" />,
    "/rides/requests": () => <RideManagement mode="requests" />,
    "/rides/management": () => <RideManagement mode="all" />,

    // Payment routes
    "/payments/history": () => <PaymentHistoryContent />,
    "/payments/methods": () => <PaymentMethodsContent />,
    "/payments/payouts": () => <PayoutsContent />,
    "/payments/invoices": () => <InvoicesContent />,

    // Chat routes
    "/chat/rooms": () => (
      <div className="h-full">
        <ChatRoomsList />
      </div>
    ),
    "/chat/notifications": () => (
      <div className="h-full">
        <NotificationsList />
      </div>
    ),
    "/chat/support": () => (
      <div className="h-full">
        <SupportChatRoomsList />
      </div>
    ),

    // Location routes
    "/locations": () => (
      <div className="h-full">
        <LocationsOverview />
      </div>
    ),
    "/locations/pickup": () => (
      <div className="h-full">
        <PickupLocationsList />
      </div>
    ),
    "/locations/dropoff": () => (
      <div className="h-full">
        <DropoffLocationsList />
      </div>
    ),
    "/locations/favorites": () => (
      <div className="h-full">
        <FavoriteLocationsList />
      </div>
    ),

    // Fleet routes
    "/fleet": () => <FleetManagementContent />,
    "/fleet/vehicles": () => <VehiclesContent />,
    "/fleet/drivers": () => <DriversContent />,
    "/fleet/routes": () => <RoutesContent />,
    "/fleet/maintenance": () => <MaintenanceContent />,
    "/fleet/fuel": () => <FuelContent />,

    // Admin sub-routes
    "/admin/users": () => <UserManagementContent />,
    "/admin/roles": () => <RoleManagementContent />,
    "/admin/settings": () => <SystemSettingsContent />,
    "/admin/reports": () => <ReportsContent />,

    // Analytics sub-routes
    "/analytics/rides": () => (
      <RideManagement mode="analytics" showAnalytics={true} />
    ),
    "/analytics/locations": () => (
      <div className="h-full">
        <LocationAnalytics />
      </div>
    ),
    "/analytics/audit": () => <AuditLogsContent />,
  },

  dashboards: {
    "/": mainDashboardConfig,
    "/dashboard": mainDashboardConfig,
    "/admin": adminDashboardConfig,
    "/analytics": analyticsDashboardConfig,
    "/analytics/payments": paymentAnalyticsConfig,
  },

  defaultContent: () => (
    <div className="bg-white rounded-lg shadow border p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Content Not Configured
      </h2>
      <p className="text-gray-600">
        This section has not been configured yet. Please add content for this
        path in your content registry.
      </p>
    </div>
  ),
};

// Generic placeholder components for common use cases
const PlaceholderComponent = ({
  title,
  description,
  icon = "📄",
}: {
  title: string;
  description: string;
  icon?: string;
}) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-600 text-2xl">{icon}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title} Dashboard
        </h3>
        <p className="text-gray-600 mb-6">
          This is a placeholder for the {title} dashboard. Configure specific
          content for this section in your content registry.
        </p>
      </div>
    </div>
  </div>
);

// Generic content registry - can be overridden by applications
export const defaultContentRegistry: ContentRegistry = {
  content: {
    // Placeholder routes that can be overridden
    "/payments": () => (
      <PlaceholderComponent
        title="Payments"
        description="Payment management interface"
        icon="💳"
      />
    ),

    // Chat routes
    "/chat/rooms": () => (
      <PlaceholderComponent
        title="Chat Rooms"
        description="Communication and messaging"
        icon="💬"
      />
    ),
    "/chat/notifications": () => (
      <PlaceholderComponent
        title="Notifications"
        description="System notifications and alerts"
        icon="🔔"
      />
    ),
    "/chat/support": () => (
      <PlaceholderComponent
        title="Support Chat"
        description="Customer support and help"
        icon="🆘"
      />
    ),

    // Location routes
    "/locations": () => (
      <PlaceholderComponent
        title="Locations"
        description="Location management and tracking"
        icon="📍"
      />
    ),
    "/locations/pickup": () => (
      <PlaceholderComponent
        title="Pickup Locations"
        description="Manage pickup points"
        icon="🚩"
      />
    ),
    "/locations/dropoff": () => (
      <PlaceholderComponent
        title="Dropoff Locations"
        description="Manage dropoff points"
        icon="🏁"
      />
    ),
    "/locations/favorites": () => (
      <PlaceholderComponent
        title="Favorite Locations"
        description="User favorite locations"
        icon="⭐"
      />
    ),

    // Fleet routes
    "/fleet": () => (
      <PlaceholderComponent
        title="Fleet Management"
        description="Vehicle and driver management"
        icon="🚗"
      />
    ),
    "/fleet/vehicles": () => (
      <PlaceholderComponent
        title="Vehicles"
        description="Vehicle management and tracking"
        icon="🚙"
      />
    ),
    "/fleet/drivers": () => (
      <PlaceholderComponent
        title="Drivers"
        description="Driver management and profiles"
        icon="👨‍💼"
      />
    ),
    "/fleet/routes": () => (
      <PlaceholderComponent
        title="Routes"
        description="Route planning and management"
        icon="🗺️"
      />
    ),
    "/fleet/maintenance": () => (
      <PlaceholderComponent
        title="Maintenance"
        description="Vehicle maintenance tracking"
        icon="🔧"
      />
    ),
    "/fleet/fuel": () => (
      <PlaceholderComponent
        title="Fuel Management"
        description="Fuel tracking and optimization"
        icon="⛽"
      />
    ),

    // Admin sub-routes
    "/admin/users": () => (
      <PlaceholderComponent
        title="User Management"
        description="Manage system users and permissions"
        icon="👥"
      />
    ),
    "/admin/roles": () => (
      <PlaceholderComponent
        title="Role Management"
        description="Define and manage user roles"
        icon="🔐"
      />
    ),
    "/admin/settings": () => (
      <PlaceholderComponent
        title="System Settings"
        description="Configure system-wide settings"
        icon="⚙️"
      />
    ),
    "/admin/reports": () => (
      <PlaceholderComponent
        title="Reports"
        description="Generate and manage reports"
        icon="📊"
      />
    ),

    // Analytics sub-routes
    "/analytics/rides": () => (
      <PlaceholderComponent
        title="Ride Analytics"
        description="Analyze ride patterns and performance"
        icon="🚗"
      />
    ),
    "/analytics/locations": () => (
      <PlaceholderComponent
        title="Location Analytics"
        description="Track location usage and trends"
        icon="📍"
      />
    ),
    "/analytics/audit": () => (
      <PlaceholderComponent
        title="Audit Logs"
        description="Monitor system activities and changes"
        icon="📝"
      />
    ),
  },

  dashboards: {},

  defaultContent: () => (
    <div className="bg-white rounded-lg shadow border p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Content Not Configured
      </h2>
      <p className="text-gray-600">
        This section has not been configured yet. Please add content for this
        path in your content registry.
      </p>
    </div>
  ),
};

// Helper function to create a custom content registry
export const createContentRegistry = (
  overrides: Partial<ContentRegistry>
): ContentRegistry => {
  return {
    content: { ...defaultContentRegistry.content, ...overrides.content },
    dashboards: {
      ...defaultContentRegistry.dashboards,
      ...overrides.dashboards,
    },
    defaultContent:
      overrides.defaultContent || defaultContentRegistry.defaultContent,
  };
};
