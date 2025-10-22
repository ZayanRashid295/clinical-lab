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
import PaymentHistoryContent from "../components/Content/PaymentHistoryContent";
import PaymentMethodsContent from "../components/Content/PaymentMethodsContent";
import PayoutsContent from "../components/Content/PayoutsContent";
import InvoicesContent from "../components/Content/InvoicesContent";
import ChatRoomsList from "../components/Chat/ChatRoomsList";
import SupportChatRoomsList from "../components/Chat/SupportChatRoomsList";
import NotificationsList from "../components/Notifications/NotificationsList";
import UserManagementContent from "../components/Content/UserManagementContent";
import RoleManagementContent from "../components/Content/RoleManagementContent";
import SystemSettingsContent from "../components/Content/SystemSettingsContent";
// import TwoTablesWithPagination from "../components/Content/TwoTablesWithPagination";
import { mainDashboardConfig, adminDashboardConfig } from "./dashboard.configs";

// Transportation content registry
export const transportationContentRegistry: ContentRegistry = {
  content: {
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

    // Admin sub-routes
    "/admin/users": () => <UserManagementContent />,
    "/admin/roles": () => <RoleManagementContent />,
    "/admin/settings": () => <SystemSettingsContent />,
    // "/admin/tables": () => <TwoTablesWithPagination />,
  },

  dashboards: {
    "/": mainDashboardConfig,
    "/dashboard": mainDashboardConfig,
    "/admin": adminDashboardConfig,
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
