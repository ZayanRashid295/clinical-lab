import React from "react";
import { ShieldCheck, Layers, CheckCircle, Ban } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import {
  EntitlementDefinition,
  EntitlementDefinitionFilters,
} from "../../types/subscription";

const columns: ColumnConfig<EntitlementDefinition>[] = [
  {
    key: "displayName",
    label: "Entitlement",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <div className="ml-4 min-w-0">
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
            {row.key}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "type",
    label: "Type",
    sortable: true,
    render: (value) => (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        {value}
      </span>
    ),
  },
  {
    key: "productSubtypeId",
    label: "Scope",
    sortable: false,
    render: (_v, row) => (
      <div className="text-sm text-gray-700">
        {row.productSubtype?.name || "Global"}
      </div>
    ),
  },
  {
    key: "isActive",
    label: "Status",
    sortable: true,
    render: (value) => (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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

const entitlementFilterConfig: FilterConfig<EntitlementDefinitionFilters> = {
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
};

/** Satisfies StatsConfig; stats values come from useEntitlementDefinitionStats + card.getValue */
const statsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total",
      icon: <Layers className="h-8 w-8" />,
      color: "rgb(37 99 235)",
      getValue: (s) => s?.total ?? 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <CheckCircle className="h-8 w-8" />,
      color: "rgb(22 163 74)",
      getValue: (s) => s?.active ?? 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <Ban className="h-8 w-8" />,
      color: "rgb(220 38 38)",
      getValue: (s) => s?.inactive ?? 0,
    },
  ],
  getStats: async () => ({}),
};

export const entitlementDefinitionTableConfig: TableConfig<
  EntitlementDefinition,
  EntitlementDefinitionFilters
> = {
  title: "Entitlement Definitions",
  description: "Define subscription entitlements and their types",
  columns,
  filterConfig: entitlementFilterConfig,
  stats: statsConfig,
  emptyStateIcon: (
    <ShieldCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No entitlement definitions found",
  addButtonLabel: "Add entitlement",
};

