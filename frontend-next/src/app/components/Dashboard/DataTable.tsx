import React from "react";
import { DataTableProps } from "../../types/ui";
import { touchPatterns, accessibility } from "../../../shared/utils/touch";

// Re-export types for convenience
export type { Column, Action, DataTableProps } from "../../types/ui";

const DataTable: React.FC<DataTableProps> = ({
  data = [],
  columns,
  actions = [],
  title = "Data Table",
  loading = false,
  error,
  emptyMessage = "No data available",
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded w-28 sm:w-32 animate-pulse"></div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className="text-left py-3 px-3 sm:px-6 whitespace-nowrap"
                    >
                      <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 animate-pulse"></div>
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="text-left py-3 px-3 sm:px-6 whitespace-nowrap">
                      <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse"></div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(3)].map((_, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className="py-3 sm:py-4 px-3 sm:px-6 whitespace-nowrap"
                      >
                        <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="py-3 sm:py-4 px-3 sm:px-6 whitespace-nowrap">
                        <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <div className="p-4 sm:p-6 text-center text-red-600 dark:text-red-400">
          <p className="text-sm sm:text-base">Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "STABLE":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
      case "MONITORING":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
          {data.length} {data.length === 1 ? "item" : "items"}
        </div>
      </div>
      <div className={`${touchPatterns.swipeableContainer} overflow-x-auto`}>
        <div className="inline-block min-w-full align-middle">
          <div className="px-4 sm:px-0">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className="text-left py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                    >
                      {column.label}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="text-left py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                      className="py-8 px-3 sm:px-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      <div className="text-sm sm:text-base">{emptyMessage}</div>
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr
                      key={row.id || index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className="py-3 sm:py-4 px-3 sm:px-6 whitespace-nowrap"
                        >
                          {column.render ? (
                            column.render(
                              row[column.key as keyof typeof row],
                              row
                            )
                          ) : (
                            <div
                              className={`${
                                column.key === "passenger" ||
                                column.key === "primary"
                                  ? "font-medium text-gray-900 dark:text-white"
                                  : "text-gray-600 dark:text-gray-300"
                              } text-xs sm:text-sm max-w-xs truncate`}
                              title={String(
                                row[column.key as keyof typeof row]
                              )}
                            >
                              {row[column.key as keyof typeof row]}
                            </div>
                          )}
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td className="py-3 sm:py-4 px-3 sm:px-6 whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            {actions.map((action, actionIndex) => {
                              const isDisabled = action.disabled
                                ? action.disabled(row)
                                : false;
                              return (
                                <button
                                  key={actionIndex}
                                  onClick={() =>
                                    !isDisabled && action.onClick(row)
                                  }
                                  disabled={isDisabled}
                                  className={`${
                                    touchPatterns.touchButton
                                  } text-xs sm:text-sm font-medium rounded ${
                                    isDisabled
                                      ? "text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                                      : action.className ||
                                        "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                  }`}
                                  aria-label={`${action.label} for ${
                                    row.passenger || "item"
                                  }`}
                                >
                                  {action.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
