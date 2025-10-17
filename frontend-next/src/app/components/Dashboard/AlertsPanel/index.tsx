import React from "react";
import { Alert } from "../../../types/ui";
import AlertItem from "./AlertItem";

interface AlertsPanelProps {
  alerts: Alert[];
  title?: string;
  loading?: boolean;
  onViewDetails?: (alert: Alert) => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  title = "Recent Alerts",
  loading = false,
  onViewDetails,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 sm:p-6 border-b">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-28 sm:w-32 animate-pulse"></div>
        </div>
        <div className="divide-y">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 sm:p-6 animate-pulse">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-3 h-3 bg-gray-200 rounded-full flex-shrink-0 mt-1"></div>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 sm:w-48"></div>
                </div>
                <div className="space-y-1 text-right flex-shrink-0">
                  <div className="h-3 bg-gray-200 rounded w-16 sm:w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 sm:w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="p-4 sm:p-6 border-b">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {title}
        </h3>
      </div>
      {alerts.length === 0 ? (
        <div className="p-4 sm:p-6 text-center text-gray-500">
          <p className="text-sm sm:text-base">No alerts at this time</p>
        </div>
      ) : (
        <div className="divide-y max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
