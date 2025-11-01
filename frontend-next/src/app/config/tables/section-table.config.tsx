import React from "react";
import { Book, Package } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { Section, SectionFilters } from "../../types/content";

const sectionColumns: ColumnConfig<Section>[] = [
  {
    key: "name",
    label: "Section Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Book className="h-5 w-5 text-blue-600" />
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
    key: "product",
    label: "Product",
    sortable: false,
    render: (value, row) => {
      const productName = row.product?.name || "-";
      return (
        <div className="flex items-center">
          <Package className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{productName}</span>
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
    label: "Chapters",
    sortable: false,
    render: (value) => {
      const count = value?.chapters || 0;
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

const sectionFilterConfig: FilterConfig<SectionFilters> = {
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

const getSectionStats = async () => {
  const { SectionsService } = await import("../../services/content/sections.service");
  const service = new SectionsService();
  return service.getSectionStats();
};

const sectionStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Sections",
      icon: <Book className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <Book className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <Book className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getSectionStats,
};

export const sectionTableConfig: TableConfig<Section, SectionFilters> = {
  title: "Section Management",
  description: "Manage content sections and their organization",
  columns: sectionColumns,
  filterConfig: sectionFilterConfig,
  stats: sectionStatsConfig,
  emptyStateIcon: <Book className="mx-auto h-12 w-12 text-gray-400 mb-4" />,
  emptyStateMessage: "No sections found",
  addButtonLabel: "Add Section",
};

