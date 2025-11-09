import React from "react";

/**
 * Pagination structure
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Column configuration for GenericDataTable
 */
export interface ColumnConfig<T> {
  key: string;
  label: string;
  sortable?: boolean;
  sortKey?: string; // If different from key
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

/**
 * Custom action button configuration
 */
export interface ActionConfig<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "primary" | "danger" | "secondary";
  className?: string;
}

/**
 * Filter field configuration
 */
export type FilterFieldType = "text" | "select" | "date" | "dateRange" | "multiselect";

export interface FilterFieldConfig<TFilters> {
  key: keyof TFilters;
  label: string;
  type: FilterFieldType;
  options?: Array<{ value: string; label: string }>; // For select/multiselect
  placeholder?: string;
}

/**
 * Filter configuration
 */
export interface FilterConfig<TFilters> {
  fields: FilterFieldConfig<TFilters>[];
  layout?: "grid" | "row";
  showActiveFilters?: boolean;
}

/**
 * Stats card configuration
 */
export interface StatsCardConfig {
  key: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  getValue: (stats: any) => number | string;
}

/**
 * Stats configuration
 */
export interface StatsConfig {
  cards: StatsCardConfig[];
  getStats: () => Promise<any>;
}

/**
 * Table configuration - main configuration object
 */
export interface TableConfig<T, TFilters> {
  // Table metadata
  title: string;
  description: string;

  // Column definitions
  columns: ColumnConfig<T>[];

  // Filter configuration
  filterConfig: FilterConfig<TFilters>;

  // Stats configuration (optional)
  stats?: StatsConfig;

  // Empty state
  emptyStateIcon?: React.ReactNode;
  emptyStateMessage?: string;

  // Actions
  actions?: ActionConfig<T>[];
  
  // Add button configuration
  addButtonLabel?: string;
  onAdd?: () => void;
}

/**
 * Props for GenericDataTable
 */
export interface GenericDataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  loading?: boolean;
  error?: string | null;
  pagination?: Pagination | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  customActions?: ActionConfig<T>[];
  emptyStateIcon?: React.ReactNode;
  emptyStateMessage?: string;
  title?: string;
}

/**
 * Props for GenericFilters component
 */
export interface GenericFiltersProps<TFilters> {
  filters: TFilters;
  filterConfig: FilterConfig<TFilters>;
  onFiltersChange: (filters: Partial<TFilters>) => void;
  onClearFilters: () => void;
}

/**
 * Props for DataManagementContent wrapper
 */
export interface DataManagementContentProps<T, TFilters> {
  config: TableConfig<T, TFilters>;
  
  // Data and state from hook
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: TFilters;
  stats?: any;
  statsLoading?: boolean;
  
  // Handlers
  onFiltersChange: (filters: Partial<TFilters>) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onRefresh: () => void;
  onView: (item: T) => void;
  onEdit: (item: T) => void;
  onDelete?: (item: T) => void;
  
  // Modal components (domain-specific)
  FormModal?: React.ComponentType<any>;
  ViewModal?: React.ComponentType<any>;
  
  // Modal state
  formModalOpen: boolean;
  viewModalOpen: boolean;
  selectedItem: T | null;
  formMode: "create" | "edit";
  
  // Modal handlers
  onCloseFormModal: () => void;
  onCloseViewModal: () => void;
  onItemSaved: (item: T) => void;
  
  // Optional: function to map selectedItem to modal props
  // e.g., (item) => ({ user: item }) or (item) => ({ role: item })
  getFormModalProps?: (item: T | null, mode: "create" | "edit") => Record<string, any>;
  getViewModalProps?: (item: T | null) => Record<string, any>;
}

