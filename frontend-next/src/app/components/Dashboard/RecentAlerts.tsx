interface Alert {
  id: number;
  title: string;
  type: string;
  message: string;
  time: string;
  severity: "high" | "medium" | "low";
}

interface RecentAlertsProps {
  alerts?: Alert[];
  title?: string;
  onViewDetails?: (alertId: number) => void;
}

const defaultAlerts: Alert[] = [
  {
    id: 1,
    title: "System Issue",
    type: "Technical",
    message: "Service reported an issue",
    time: "10 minutes ago",
    severity: "high",
  },
  {
    id: 2,
    title: "Payment Issue",
    type: "Financial",
    message: "Payment method declined",
    time: "30 minutes ago",
    severity: "medium",
  },
  {
    id: 3,
    title: "General Notice",
    type: "Information",
    message: "System maintenance scheduled",
    time: "1 hour ago",
    severity: "low",
  },
];

const RecentAlerts: React.FC<RecentAlertsProps> = ({
  alerts,
  title = "Recent Alerts",
  onViewDetails,
}) => {
  const alertData = alerts || defaultAlerts;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="divide-y">
        {alertData.map((alert) => (
          <div
            key={alert.id}
            className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  alert.severity === "high"
                    ? "bg-red-500"
                    : alert.severity === "medium"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {alert.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {alert.type}: {alert.message}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {alert.time}
              </p>
              <button
                onClick={() => onViewDetails?.(alert.id)}
                className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-800 dark:hover:text-blue-300"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentAlerts;
