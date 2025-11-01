import React from "react";
import { Shield, Key } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsCardConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { Role, RoleFilters } from "../../types/user";

/**
 * Column definitions for Role table
 */
const roleColumns: ColumnConfig<Role>[] = [
  {
    key: "name",
    label: "Role Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">{row.name}</div>
        </div>
      </div>
    ),
  },
  {
    key: "displayName",
    label: "Display Name",
    sortable: true,
    render: (value) => (
      <div className="text-sm text-gray-900">{value || "-"}</div>
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
    key: "permissions",
    label: "Permissions",
    sortable: false,
    render: (value) => (
      <div className="flex items-center">
        <Key className="h-4 w-4 text-gray-400 mr-1" />
        <span className="text-sm text-gray-900">
          {Array.isArray(value) ? value.length : 0}
        </span>
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
];

/**
 * Filter configuration for Role table
 */
const roleFilterConfig: FilterConfig<RoleFilters> = {
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
 * Stats configuration for Role table
 */
const getRoleStats = async () => {
  const { RolesService } = await import("../../services/roles/roles.service");
  const service = new RolesService();
  return service.getRoleStats();
};

const roleStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Roles",
      icon: <Shield className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active Roles",
      icon: <Shield className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive Roles",
      icon: <Shield className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getRoleStats,
};

/**
 * Complete Role table configuration
 */
export const roleTableConfig: TableConfig<Role, RoleFilters> = {
  title: "Role Management",
  description: "Define and manage user roles and permissions",
  columns: roleColumns,
  filterConfig: roleFilterConfig,
  stats: roleStatsConfig,
  emptyStateIcon: <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />,
  emptyStateMessage: "No roles found",
  addButtonLabel: "Add Role",
};

