import React from "react";
import { Star, Key } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import {
  PackageFeature,
  PackageFeatureFilters,
} from "../../types/subscription";

/**
 * Column definitions for Package Feature table
 */
const packageFeatureColumns: ColumnConfig<PackageFeature>[] = [
  {
    key: "name",
    label: "Feature Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <Star className="h-5 w-5 text-yellow-600" />
          </div>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {row.description}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "description",
    label: "Description",
    sortable: false,
    render: (value) => (
      <div className="text-sm text-gray-900 max-w-xs truncate">
        {value || "-"}
      </div>
    ),
  },
  {
    key: "isActive",
    label: "Status",
    sortable: true,
    render: (value) => {
      const getStatusColor = (isActive: boolean) => {
        return isActive
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800";
      };
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
            value
          )}`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      );
    },
  },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    render: (value) => {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    },
  },
  {
    key: "updatedAt",
    label: "Updated",
    sortable: true,
    render: (value) => {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    },
  },
];

/**
 * Filter configuration for Package Feature table
 */
const packageFeatureFilterConfig: FilterConfig<PackageFeatureFilters> = {
  fields: [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
      ],
    },
    {
      key: "dateFrom",
      label: "Date",
      type: "dateRange",
    },
  ],
  layout: "grid",
  showActiveFilters: true,
};

/**
 * Stats configuration for Package Feature table
 */
const getPackageFeatureStats = async () => {
  const { PackageFeaturesService } = await import("../../services/subscriptions/package-features.service");
  const service = new PackageFeaturesService();
  return service.getFeatureStats();
};

const packageFeatureStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Features",
      icon: <Star className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active Features",
      icon: <Star className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive Features",
      icon: <Star className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getPackageFeatureStats,
};

/**
 * Complete Package Feature table configuration
 */
export const packageFeatureTableConfig: TableConfig<
  PackageFeature,
  PackageFeatureFilters
> = {
  title: "Package Feature Management",
  description: "Define and manage available package features",
  columns: packageFeatureColumns,
  filterConfig: packageFeatureFilterConfig,
  stats: packageFeatureStatsConfig,
  emptyStateIcon: (
    <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No package features found",
  addButtonLabel: "Add Feature",
};

