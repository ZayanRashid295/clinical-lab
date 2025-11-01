import React from "react";
import { Layers, Package } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { ProductSubtype, ProductSubtypeFilters } from "../../types/product";

const productSubtypeColumns: ColumnConfig<ProductSubtype>[] = [
  {
    key: "name",
    label: "Subtype Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Layers className="h-5 w-5 text-purple-600" />
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
    key: "subscriptionPackages",
    label: "Packages",
    sortable: false,
    render: (value) => {
      const packages = Array.isArray(value) ? value : [];
      return (
        <span className="text-sm text-gray-900">{packages.length} packages</span>
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

const productSubtypeFilterConfig: FilterConfig<ProductSubtypeFilters> = {
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

const getProductSubtypeStats = async () => {
  const { ProductSubtypesService } = await import("../../services/products/product-subtypes.service");
  const service = new ProductSubtypesService();
  return service.getSubtypeStats();
};

const productSubtypeStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Subtypes",
      icon: <Layers className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <Layers className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <Layers className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getProductSubtypeStats,
};

export const productSubtypeTableConfig: TableConfig<
  ProductSubtype,
  ProductSubtypeFilters
> = {
  title: "Product Subtype Management",
  description: "Manage product subtypes and variations",
  columns: productSubtypeColumns,
  filterConfig: productSubtypeFilterConfig,
  stats: productSubtypeStatsConfig,
  emptyStateIcon: (
    <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No subtypes found",
  addButtonLabel: "Add Subtype",
};

