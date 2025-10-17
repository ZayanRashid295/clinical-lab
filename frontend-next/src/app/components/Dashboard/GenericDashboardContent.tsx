import { Plus } from "lucide-react";
import { DashboardContentProps } from "../../types/ui";
import StatsCards from "./StatsCards";
import RecentAlerts from "./RecentAlerts";
import DataTable from "./DataTable";

const GenericDashboardContent: React.FC<DashboardContentProps> = ({
  title = "Dashboard",
  showQuickAction = true,
  quickActionLabel = "Quick Action",
  onQuickAction,
  customStats,
  customAlerts,
  customTable,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        {showQuickAction && (
          <button
            onClick={onQuickAction}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus size={16} />
            {quickActionLabel}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {customStats || <StatsCards stats={[]} />}

      {/* Recent Alerts */}
      {customAlerts || <RecentAlerts />}

      {/* Recent Data Table */}
      {customTable || (
        <DataTable
          data={[]}
          columns={[
            { key: "name", label: "Name" },
            { key: "status", label: "Status" },
            { key: "date", label: "Date" },
          ]}
          title="Recent Activity"
        />
      )}
    </div>
  );
};

export default GenericDashboardContent;
