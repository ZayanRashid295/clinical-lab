import { ContentRegistry } from "../types/dashboard";

// Helper function to create a content registry
// export const createContentRegistry = (
//   config: Partial<ContentRegistry> = {}
// ): ContentRegistry => {
//   return {
//     content: config.content || {},
//     dashboards: config.dashboards || {},
//     defaultContent: config.defaultContent,
//   };
// };

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
import { ShadowModeContent } from "../components/ShadowMode";

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
    "/shadow-mode": () => <ShadowModeContent />,
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
