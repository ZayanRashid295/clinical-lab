import React from "react";
import Image from "next/image";
import { Users, Mail, Phone, Shield } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsCardConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { User, UserFilters } from "../../types/user";

/**
 * Column definitions for User table
 */
const userColumns: ColumnConfig<User>[] = [
  {
    key: "firstName",
    label: "User",
    sortable: true,
    sortKey: "firstName",
    render: (value, row) => {
      const displayName = `${row.firstName} ${row.lastName}`;
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {row.avatar ? (
              <Image
                className="h-10 w-10 rounded-full"
                src={row.avatar}
                alt={displayName}
                width={40}
                height={40}
                unoptimized
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {displayName}
            </div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    key: "email",
    label: "Contact",
    sortable: true,
    render: (value, row) => (
      <div>
        <div className="text-sm text-gray-900">{row.phone || "No phone"}</div>
        <div className="text-sm text-gray-500">{row.email}</div>
      </div>
    ),
  },
  {
    key: "roles",
    label: "Role",
    sortable: true,
    sortKey: "role",
    render: (value) => {
      const role = value?.[0]?.role?.name || "USER";
      const getRoleColor = (role: string) => {
        switch (role) {
          case "ADMIN":
            return "bg-purple-100 text-purple-800";
          case "FLEET_MANAGER":
            return "bg-blue-100 text-blue-800";
          case "DRIVER":
            return "bg-green-100 text-green-800";
          case "CUSTOMER_SUPPORT":
            return "bg-orange-100 text-orange-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      };
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
            role
          )}`}
        >
          {role.replace("_", " ")}
        </span>
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
 * Filter configuration for User table
 */
const userFilterConfig: FilterConfig<UserFilters> = {
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
      key: "role",
      label: "Role",
      type: "select",
      options: [
        { value: "ADMIN", label: "Admin" },
        { value: "FLEET_MANAGER", label: "Fleet Manager" },
        { value: "DRIVER", label: "Driver" },
        { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
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
 * Stats configuration for User table
 */
const getUserStats = async () => {
  const { UsersService } = await import("../../services/users/users.service");
  const service = new UsersService();
  return service.getUserStats();
};

const userStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Users",
      icon: <Users className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active Users",
      icon: <Users className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive Users",
      icon: <Users className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
    {
      key: "pending",
      label: "Pending Users",
      icon: <Users className="h-8 w-8" />,
      getValue: (stats) => stats?.pending || 0,
    },
  ],
  getStats: getUserStats,
};

/**
 * Complete User table configuration
 */
export const userTableConfig: TableConfig<User, UserFilters> = {
  title: "User Management",
  description: "Manage system users and their permissions",
  columns: userColumns,
  filterConfig: userFilterConfig,
  stats: userStatsConfig,
  emptyStateIcon: <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />,
  emptyStateMessage: "No users found",
  addButtonLabel: "Add User",
};
