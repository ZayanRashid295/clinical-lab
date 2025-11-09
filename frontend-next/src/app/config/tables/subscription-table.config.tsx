import React from "react";
import { CreditCard, Calendar, User, Package, Clock } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import {
  Subscription,
  SubscriptionFilters,
} from "../../types/subscription";

/**
 * Column definitions for Subscription table
 */
const subscriptionColumns: ColumnConfig<Subscription>[] = [
  {
    key: "user",
    label: "User",
    sortable: false,
    render: (value, row) => {
      const userName = row.user
        ? `${row.user.firstName} ${row.user.lastName}`
        : "Unknown User";
      const userEmail = row.user?.email || "-";
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{userName}</div>
            <div className="text-sm text-gray-500">{userEmail}</div>
          </div>
        </div>
      );
    },
  },
  {
    key: "subscriptionPackage",
    label: "Package",
    sortable: false,
    render: (value, row) => {
      const packageName = row.subscriptionPackage?.name || "-";
      const productSubtype = row.subscriptionPackage?.productSubtype?.name || "";
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">{packageName}</div>
          {productSubtype && (
            <div className="text-sm text-gray-500">{productSubtype}</div>
          )}
        </div>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (value) => {
      const getStatusColor = (status: string) => {
        switch (status) {
          case "ACTIVE":
            return "bg-green-100 text-green-800";
          case "EXPIRED":
            return "bg-gray-100 text-gray-800";
          case "CANCELLED":
            return "bg-red-100 text-red-800";
          case "SUSPENDED":
            return "bg-yellow-100 text-yellow-800";
          case "PENDING":
            return "bg-blue-100 text-blue-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      };
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
            value
          )}`}
        >
          {value}
        </span>
      );
    },
  },
  {
    key: "startDate",
    label: "Start Date",
    sortable: true,
    render: (value) => {
      return (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">
            {new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(new Date(value))}
          </span>
        </div>
      );
    },
  },
  {
    key: "endDate",
    label: "End Date",
    sortable: true,
    render: (value) => {
      return (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">
            {new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(new Date(value))}
          </span>
        </div>
      );
    },
  },
  {
    key: "autoRenew",
    label: "Auto Renew",
    sortable: true,
    render: (value) => {
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Yes" : "No"}
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
 * Filter configuration for Subscription table
 */
const subscriptionFilterConfig: FilterConfig<SubscriptionFilters> = {
  fields: [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "EXPIRED", label: "Expired" },
        { value: "CANCELLED", label: "Cancelled" },
        { value: "SUSPENDED", label: "Suspended" },
        { value: "PENDING", label: "Pending" },
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
 * Stats configuration for Subscription table
 */
const getSubscriptionStats = async () => {
  const { SubscriptionsService } = await import("../../services/subscriptions/subscriptions.service");
  const service = new SubscriptionsService();
  return service.getSubscriptionStats();
};

const subscriptionStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Subscriptions",
      icon: <CreditCard className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <CreditCard className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "expired",
      label: "Expired",
      icon: <Clock className="h-8 w-8" />,
      getValue: (stats) => stats?.expired || 0,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      icon: <CreditCard className="h-8 w-8" />,
      getValue: (stats) => stats?.cancelled || 0,
    },
  ],
  getStats: getSubscriptionStats,
};

/**
 * Complete Subscription table configuration
 */
export const subscriptionTableConfig: TableConfig<
  Subscription,
  SubscriptionFilters
> = {
  title: "Subscription Management",
  description: "Manage user subscriptions and their status",
  columns: subscriptionColumns,
  filterConfig: subscriptionFilterConfig,
  stats: subscriptionStatsConfig,
  emptyStateIcon: (
    <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No subscriptions found",
  addButtonLabel: "Add Subscription",
};

