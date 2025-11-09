import React from "react";
import { BookOpen, Book } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { Chapter, ChapterFilters } from "../../types/content";

const chapterColumns: ColumnConfig<Chapter>[] = [
  {
    key: "name",
    label: "Chapter Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-purple-600" />
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
    key: "section",
    label: "Section",
    sortable: false,
    render: (value, row) => {
      const sectionName = row.section?.name || "-";
      const productName = row.section?.product?.name;
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">{sectionName}</div>
          {productName && (
            <div className="text-sm text-gray-500">{productName}</div>
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
    label: "Topics",
    sortable: false,
    render: (value) => {
      const count = value?.topics || 0;
      return <span className="text-sm text-gray-900">{count}</span>;
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

const chapterFilterConfig: FilterConfig<ChapterFilters> = {
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

const getChapterStats = async () => {
  const { ChaptersService } = await import("../../services/content/chapters.service");
  const service = new ChaptersService();
  return service.getChapterStats();
};

const chapterStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Chapters",
      icon: <BookOpen className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <BookOpen className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <BookOpen className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getChapterStats,
};

export const chapterTableConfig: TableConfig<Chapter, ChapterFilters> = {
  title: "Chapter Management",
  description: "Manage content chapters within sections",
  columns: chapterColumns,
  filterConfig: chapterFilterConfig,
  stats: chapterStatsConfig,
  emptyStateIcon: (
    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No chapters found",
  addButtonLabel: "Add Chapter",
};

