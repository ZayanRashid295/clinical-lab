import React from "react";
import { Package, Tag } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { Product, ProductFilters } from "../../types/product";

const productColumns: ColumnConfig<Product>[] = [
  {
    key: "name",
    label: "Product Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-600" />
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
    key: "productSubtypes",
    label: "Subtypes",
    sortable: false,
    render: (value) => {
      const subtypes = Array.isArray(value) ? value : [];
      return (
        <div className="flex items-center">
          <Tag className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{subtypes.length}</span>
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

const productFilterConfig: FilterConfig<ProductFilters> = {
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

const getProductStats = async () => {
  const { ProductsService } = await import("../../services/products/products.service");
  const service = new ProductsService();
  return service.getProductStats();
};

const productStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Products",
      icon: <Package className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <Package className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <Package className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getProductStats,
};

export const productTableConfig: TableConfig<Product, ProductFilters> = {
  title: "Product Management",
  description: "Manage products and their configurations",
  columns: productColumns,
  filterConfig: productFilterConfig,
  stats: productStatsConfig,
  emptyStateIcon: <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />,
  emptyStateMessage: "No products found",
  addButtonLabel: "Add Product",
};

