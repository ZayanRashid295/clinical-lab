import React from "react";
import { DashboardConfig } from "../../../app/types/dashboard";

interface DashboardRendererProps {
  config: DashboardConfig;
  className?: string;
}

const DashboardRenderer: React.FC<DashboardRendererProps> = ({
  config,
  className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
}) => {
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string } } = {
      blue: { bg: "bg-blue-100", text: "text-blue-600" },
      green: { bg: "bg-green-100", text: "text-green-600" },
      purple: { bg: "bg-purple-100", text: "text-purple-600" },
      yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
      red: { bg: "bg-red-100", text: "text-red-600" },
      gray: { bg: "bg-gray-100", text: "text-gray-600" },
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {config.title}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {config.description}
        </p>
      </div>

      {/* Stats */}
      {config.stats && config.stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {config.stats.map((stat, index) => {
            const colorClasses = getColorClasses(stat.color);
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 ${colorClasses.bg} rounded-lg flex items-center justify-center`}
                    >
                      <span className={`${colorClasses.text} text-lg`}>
                        {stat.icon}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {config.quickActions && config.quickActions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {config.quickActions.map((action, index) => {
            const colorClasses = getColorClasses(action.color);
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow cursor-pointer"
                onClick={action.onClick}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center`}
                    >
                      <span className={`${colorClasses.text} text-xl`}>
                        {action.icon}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Activity */}
      {config.recentActivity && config.recentActivity.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {config.recentActivity.map((activity, index) => {
              const dotColor =
                {
                  success: "bg-green-500",
                  info: "bg-blue-500",
                  warning: "bg-yellow-500",
                  error: "bg-red-500",
                }[activity.type] || "bg-gray-500";

              return (
                <div key={index} className="flex items-center text-sm">
                  <div
                    className={`w-2 h-2 ${dotColor} rounded-full mr-3`}
                  ></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {activity.message}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 ml-auto">
                    {activity.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardRenderer;
