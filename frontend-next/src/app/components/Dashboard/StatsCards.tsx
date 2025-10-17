import React from "react";
import { StatCard } from "../../types/ui";
import { touchPatterns } from "../../../shared/utils/touch";

interface StatsCardsProps {
  stats: StatCard[];
  loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 sm:w-24"></div>
                <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16"></div>
              </div>
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 ml-2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            className={`${stat.bgColor || "bg-white dark:bg-gray-800"} ${
              touchPatterns.tappableCard
            } p-4 sm:p-6 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/30`}
            role="button"
            tabIndex={0}
            aria-label={`${stat.label}: ${stat.value}`}
            onClick={() => console.log(`Clicked ${stat.label} card`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                console.log(`Activated ${stat.label} card`);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {stat.label}
                </p>
                <p
                  className={`text-lg sm:text-2xl font-bold ${
                    stat.textColor || "text-gray-900 dark:text-white"
                  } truncate`}
                >
                  {stat.value}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2 sm:ml-3">
                <IconComponent
                  className={`${stat.color} transition-transform duration-200`}
                  size={20}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
