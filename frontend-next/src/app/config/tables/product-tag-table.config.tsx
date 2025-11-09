import React from "react";
import { Tag, Palette } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { ProductTag, ProductTagFilters } from "../../types/product";

const productTagColumns: ColumnConfig<ProductTag>[] = [
  {
    key: "name",
    label: "Tag Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: row.color
                ? `${row.color}20`
                : "rgb(229 231 235)",
            }}
          >
            <Tag
              className="h-5 w-5"
              style={{ color: row.color || "#6B7280" }}
            />
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
    key: "color",
    label: "Color",
    sortable: false,
    render: (value) => {
      if (!value) return <span className="text-sm text-gray-500">-</span>;
      return (
        <div className="flex items-center">
          <div
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: value }}
          />
          <span className="ml-2 text-sm text-gray-900">{value}</span>
        </div>
      );
    },
  },
  {
    key: "_count",
    label: "Usage",
    sortable: false,
    render: (value) => {
      const count = value?.products || 0;
      return <span className="text-sm text-gray-900">{count} products</span>;
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

const productTagFilterConfig: FilterConfig<ProductTagFilters> = {
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

const getProductTagStats = async () => {
  const { ProductTagsService } = await import("../../services/products/product-tags.service");
  const service = new ProductTagsService();
  return service.getTagStats();
};

const productTagStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Tags",
      icon: <Tag className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <Tag className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <Tag className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getProductTagStats,
};

export const productTagTableConfig: TableConfig<
  ProductTag,
  ProductTagFilters
> = {
  title: "Product Tag Management",
  description: "Manage product tags and categories",
  columns: productTagColumns,
  filterConfig: productTagFilterConfig,
  stats: productTagStatsConfig,
  emptyStateIcon: <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />,
  emptyStateMessage: "No tags found",
  addButtonLabel: "Add Tag",
};

