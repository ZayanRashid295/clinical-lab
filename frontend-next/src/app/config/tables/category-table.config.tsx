import React from "react";
import { GraduationCap } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { Category, CategoryFilters } from "../../types/category";

const categoryColumns: ColumnConfig<Category>[] = [
  {
    key: "name",
    label: "Category",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-lg">{row.icon || "📚"}</span>
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
    key: "slug",
    label: "Slug",
    sortable: true,
    render: (value) => (
      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{value}</code>
    ),
  },
  {
    key: "_count" as any,
    label: "Products",
    sortable: false,
    render: (value) => {
      const count = value?.products ?? 0;
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {count} products
        </span>
      );
    },
  },
  {
    key: "order",
    label: "Order",
    sortable: true,
    render: (value) => (
      <span className="text-sm text-gray-600">{value}</span>
    ),
  },
  {
    key: "isActive",
    label: "Status",
    sortable: true,
    render: (value) => (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {value ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    render: (value) =>
      new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value)),
  },
];

const categoryFilterConfig: FilterConfig<CategoryFilters> = {
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

const getCategoryStats = async () => {
  const { CategoriesService } = await import(
    "../../services/categories/categories.service"
  );
  const service = new CategoriesService();
  return service.getCategoryStats();
};

const categoryStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Categories",
      icon: <GraduationCap className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <GraduationCap className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <GraduationCap className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getCategoryStats,
};

export const categoryTableConfig: TableConfig<
  Category,
  CategoryFilters
> = {
  title: "Category Management",
  description: "Manage categories (e.g., Medical, Nursing, Legal)",
  columns: categoryColumns,
  filterConfig: categoryFilterConfig,
  stats: categoryStatsConfig,
  emptyStateIcon: (
    <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No categories found",
  addButtonLabel: "Add Category",
};
