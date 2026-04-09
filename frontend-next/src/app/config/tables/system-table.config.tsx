import React from "react";
import { Layers } from "lucide-react";
import { TableConfig, ColumnConfig, FilterConfig, StatsConfig } from "../../../shared/components/DataTable/types";
import { System, SystemFilters } from "../../types/content";

const systemColumns: ColumnConfig<System>[] = [
  { key: "name", label: "System", sortable: true, render: (value, row) => (
    <div><div className="text-sm font-medium text-gray-900">{value}</div>{row.description && (<div className="text-sm text-gray-500 truncate max-w-xs">{row.description}</div>)}</div>
  )},
  { key: "product" as any, label: "Product", sortable: false, render: (value) => (<span className="text-sm text-gray-600">{value?.name || "—"}</span>) },
  { key: "_count" as any, label: "Topics", sortable: false, render: (value) => (<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{value?.topics ?? 0}</span>) },
  { key: "order", label: "Order", sortable: true, render: (value) => (<span className="text-sm text-gray-600">{value}</span>) },
  { key: "isActive", label: "Status", sortable: true, render: (value) => (<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{value ? "Active" : "Inactive"}</span>) },
  { key: "createdAt", label: "Created", sortable: true, render: (value) => new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value)) },
];

const systemFilterConfig: FilterConfig<SystemFilters> = {
  fields: [
    { key: "status", label: "Status", type: "select", options: [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }] },
    { key: "dateFrom", label: "Date", type: "dateRange" },
  ],
  layout: "grid",
  showActiveFilters: true,
};

const getSystemStats = async () => {
  const { SystemsService } = await import("../../services/systems/systems.service");
  return new SystemsService().getSystemStats();
};

const systemStatsConfig: StatsConfig = {
  cards: [
    { key: "total", label: "Total Systems", icon: <Layers className="h-8 w-8" />, getValue: (stats) => stats?.total || 0 },
    { key: "active", label: "Active", icon: <Layers className="h-8 w-8" />, getValue: (stats) => stats?.active || 0 },
    { key: "inactive", label: "Inactive", icon: <Layers className="h-8 w-8" />, getValue: (stats) => stats?.inactive || 0 },
  ],
  getStats: getSystemStats,
};

export const systemTableConfig: TableConfig<System, SystemFilters> = {
  title: "System Management",
  description: "Manage systems (e.g., Cardiovascular, Hematology, Neurology)",
  columns: systemColumns,
  filterConfig: systemFilterConfig,
  stats: systemStatsConfig,
  emptyStateIcon: (<Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />),
  emptyStateMessage: "No systems found",
  addButtonLabel: "Add System",
};
