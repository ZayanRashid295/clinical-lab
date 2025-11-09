import React from "react";
import { FileText, BookOpen } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { Topic, TopicFilters } from "../../types/content";

const topicColumns: ColumnConfig<Topic>[] = [
  {
    key: "name",
    label: "Topic Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-green-600" />
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
    key: "chapter",
    label: "Chapter",
    sortable: false,
    render: (value, row) => {
      const chapterName = row.chapter?.name || "-";
      const sectionName = row.chapter?.section?.name;
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">{chapterName}</div>
          {sectionName && (
            <div className="text-sm text-gray-500">{sectionName}</div>
          )}
        </div>
      );
    },
  },
  {
    key: "order",
    label: "Order",
    sortable: true,
    render: (value) => (
      <span className="text-sm text-gray-900">{value}</span>
    ),
  },
  {
    key: "_count",
    label: "Questions",
    sortable: false,
    render: (value) => {
      const count = value?.questions || 0;
      return (
        <div className="flex items-center">
          <BookOpen className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">{count}</span>
        </div>
      );
    },
  },
  {
    key: "isActive",
    label: "Status",
    sortable: true,
    render: (value) => {
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
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
      }).format(new Date(value));
    },
  },
];

const topicFilterConfig: FilterConfig<TopicFilters> = {
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

const getTopicStats = async () => {
  const { TopicsService } = await import("../../services/content/topics.service");
  const service = new TopicsService();
  return service.getTopicStats();
};

const topicStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Topics",
      icon: <FileText className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <FileText className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <FileText className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getTopicStats,
};

export const topicTableConfig: TableConfig<Topic, TopicFilters> = {
  title: "Topic Management",
  description: "Manage content topics within chapters",
  columns: topicColumns,
  filterConfig: topicFilterConfig,
  stats: topicStatsConfig,
  emptyStateIcon: (
    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No topics found",
  addButtonLabel: "Add Topic",
};

