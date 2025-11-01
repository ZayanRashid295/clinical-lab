import React from "react";
import { Package, DollarSign, Calendar, Tag } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import {
  SubscriptionPackage,
  SubscriptionPackageFilters,
} from "../../types/subscription";

/**
 * Column definitions for Subscription Package table
 */
const subscriptionPackageColumns: ColumnConfig<SubscriptionPackage>[] = [
  {
    key: "name",
    label: "Package Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Package className="h-5 w-5 text-purple-600" />
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
    key: "productSubtype",
    label: "Product Subtype",
    sortable: false,
    render: (value, row) => {
      const subtypeName = row.productSubtype?.name || "-";
      return (
        <div className="flex items-center">
          <Tag className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{subtypeName}</span>
        </div>
      );
    },
  },
  {
    key: "price",
    label: "Price",
    sortable: true,
    render: (value, row) => {
      const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: row.currency || "USD",
      }).format(Number(value));
      return (
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            {formattedPrice}
          </span>
        </div>
      );
    },
  },
  {
    key: "validityDays",
    label: "Validity",
    sortable: true,
    render: (value) => {
      const days = value;
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      const displayText =
        months > 0
          ? `${months} ${months === 1 ? "month" : "months"}${remainingDays > 0 ? ` ${remainingDays} days` : ""}`
          : `${days} ${days === 1 ? "day" : "days"}`;
      return (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{displayText}</span>
        </div>
      );
    },
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
];

/**
 * Filter configuration for Subscription Package table
 */
const subscriptionPackageFilterConfig: FilterConfig<SubscriptionPackageFilters> =
  {
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
 * Stats configuration for Subscription Package table
 */
const getSubscriptionPackageStats = async () => {
  const { SubscriptionPackagesService } = await import("../../services/subscriptions/subscription-packages.service");
  const service = new SubscriptionPackagesService();
  return service.getPackageStats();
};

const subscriptionPackageStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Packages",
      icon: <Package className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active Packages",
      icon: <Package className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive Packages",
      icon: <Package className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getSubscriptionPackageStats,
};

/**
 * Complete Subscription Package table configuration
 */
export const subscriptionPackageTableConfig: TableConfig<
  SubscriptionPackage,
  SubscriptionPackageFilters
> = {
  title: "Subscription Package Management",
  description: "Define and manage subscription packages",
  columns: subscriptionPackageColumns,
  filterConfig: subscriptionPackageFilterConfig,
  stats: subscriptionPackageStatsConfig,
  emptyStateIcon: <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />,
  emptyStateMessage: "No subscription packages found",
  addButtonLabel: "Add Package",
};

