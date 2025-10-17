import React from "react";
import { Alert } from "../../../types/ui";
import { touchPatterns, accessibility } from "../../../../shared/utils/touch";

interface AlertItemProps {
  alert: Alert;
  onViewDetails?: (alert: Alert) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onViewDetails }) => {
  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(alert);
    } else {
      console.log("View alert details:", alert);
    }
  };

  return (
    <div className={`${touchPatterns.touchListItem} hover:bg-gray-50`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 mt-2 ${getSeverityColor(
            alert.severity
          )}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                {alert.passenger}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                <span className="font-medium">{alert.type}:</span>{" "}
                {alert.message}
              </p>
            </div>
            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right flex-shrink-0">
              <p className="text-xs sm:text-sm text-gray-500">{alert.time}</p>
              <button
                onClick={handleViewDetails}
                className={`${touchPatterns.touchButton} text-blue-600 text-xs sm:text-sm hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md font-medium`}
                aria-label={`View details for ${alert.passenger} alert`}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertItem;
