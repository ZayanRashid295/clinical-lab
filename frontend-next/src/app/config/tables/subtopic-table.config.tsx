import React from "react";
import { FileText } from "lucide-react";
import { TableConfig, ColumnConfig, FilterConfig, StatsConfig } from "../../../shared/components/DataTable/types";
import { Subtopic, SubtopicFilters } from "../../types/content";

const subtopicColumns: ColumnConfig<Subtopic>[] = [
  { key: "name", label: "Subtopic", sortable: true, render: (value, row) => (
    <div><div className="text-sm font-medium text-gray-900">{value}</div>{row.description && (<div className="text-sm text-gray-500 truncate max-w-xs">{row.description}</div>)}</div>
  )},
  { key: "topic" as any, label: "Topic", sortable: false, render: (value) => (<span className="text-sm text-gray-600">{value?.name || "—"}</span>) },
  { key: "_count" as any, label: "Questions", sortable: false, render: (value) => (<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{value?.questions ?? 0}</span>) },
  { key: "order", label: "Order", sortable: true, render: (value) => (<span className="text-sm text-gray-600">{value}</span>) },
  { key: "isActive", label: "Status", sortable: true, render: (value) => (<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{value ? "Active" : "Inactive"}</span>) },
  { key: "createdAt", label: "Created", sortable: true, render: (value) => new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value)) },
];

const subtopicFilterConfig: FilterConfig<SubtopicFilters> = {
  fields: [
    { key: "status", label: "Status", type: "select", options: [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }] },
    { key: "dateFrom", label: "Date", type: "dateRange" },
  ],
  layout: "grid",
  showActiveFilters: true,
};

const getSubtopicStats = async () => {
  const { SubtopicsService } = await import("../../services/content/subtopics.service");
  return new SubtopicsService().getSubtopicStats();
};

const subtopicStatsConfig: StatsConfig = {
  cards: [
    { key: "total", label: "Total Subtopics", icon: <FileText className="h-8 w-8" />, getValue: (stats) => stats?.total || 0 },
    { key: "active", label: "Active", icon: <FileText className="h-8 w-8" />, getValue: (stats) => stats?.active || 0 },
    { key: "inactive", label: "Inactive", icon: <FileText className="h-8 w-8" />, getValue: (stats) => stats?.inactive || 0 },
  ],
  getStats: getSubtopicStats,
};

export const subtopicTableConfig: TableConfig<Subtopic, SubtopicFilters> = {
  title: "Subtopic Management",
  description: "Manage subtopics (specific learning aspects under topics)",
  columns: subtopicColumns,
  filterConfig: subtopicFilterConfig,
  stats: subtopicStatsConfig,
  emptyStateIcon: (<FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />),
  emptyStateMessage: "No subtopics found",
  addButtonLabel: "Add Subtopic",
};
