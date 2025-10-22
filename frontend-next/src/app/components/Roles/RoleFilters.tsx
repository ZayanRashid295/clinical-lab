import React from "react";
import { Search, X } from "lucide-react";
import { RoleFilters as RoleFiltersType } from "../../types/user";

interface RoleFiltersProps {
  filters: RoleFiltersType;
  onFiltersChange: (filters: Partial<RoleFiltersType>) => void;
  onClearFilters: () => void;
}

const RoleFilters: React.FC<RoleFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const roleStatuses: ("ACTIVE" | "INACTIVE")[] = ["ACTIVE", "INACTIVE"];

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "" && value !== null
  );

  return (
    <div className="bg-white rounded-lg shadow border p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            value={filters.status || ""}
            onChange={(e) =>
              onFiltersChange({
                status: (e.target.value as "ACTIVE" | "INACTIVE") || undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {roleStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div>
          <label
            htmlFor="dateFrom"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date From
          </label>
          <input
            type="date"
            id="dateFrom"
            value={filters.dateFrom || ""}
            onChange={(e) =>
              onFiltersChange({ dateFrom: e.target.value || undefined })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="dateTo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date To
          </label>
          <input
            type="date"
            id="dateTo"
            value={filters.dateTo || ""}
            onChange={(e) =>
              onFiltersChange({ dateTo: e.target.value || undefined })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div></div>
        <div></div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Status: {filters.status}
                <button
                  onClick={() => onFiltersChange({ status: undefined })}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                Date: {filters.dateFrom || "∞"} - {filters.dateTo || "∞"}
                <button
                  onClick={() =>
                    onFiltersChange({
                      dateFrom: undefined,
                      dateTo: undefined,
                    })
                  }
                  className="text-orange-600 hover:text-orange-800"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleFilters;
