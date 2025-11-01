import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  LayoutGrid,
  Table,
  Plus,
} from "lucide-react";
import GenericDataTable from "./GenericDataTable";
import GenericFilters from "./GenericFilters";
import { DataManagementContentProps, Pagination } from "./types";
import PaginationComponent from "../../../app/components/Users/Pagination";

/**
 * Generic Data Management Content Component
 * 
 * A complete management page wrapper that includes:
 * - Stats cards
 * - Search bar
 * - Filter panel
 * - Data table
 * - Pagination
 * - Modals (passed as props, domain-specific)
 */
function DataManagementContent<T extends { id: string }, TFilters extends Record<string, any>>({
  config,
  data,
  loading,
  error,
  pagination,
  filters,
  stats,
  statsLoading,
  onFiltersChange,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onRefresh,
  onView,
  onEdit,
  onDelete,
  FormModal,
  ViewModal,
  formModalOpen,
  viewModalOpen,
  selectedItem,
  formMode,
  onCloseFormModal,
  onCloseViewModal,
  onItemSaved,
  getFormModalProps,
  getViewModalProps,
}: DataManagementContentProps<T, TFilters>) {
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const contentRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  // Track content height to prevent layout shift
  useEffect(() => {
    if (!loading && contentRef.current) {
      const height = contentRef.current.offsetHeight;
      if (height > 0) {
        setMinHeight(height);
      }
    }
  }, [loading, data.length]);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value || undefined } as Partial<TFilters>);
  };

  const searchValue = (filters as any).search || "";

  // Extract sortBy and sortOrder from filters
  const sortBy = (filters as any).sortBy;
  const sortOrder = (filters as any).sortOrder || "desc";

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-3">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
          <p className="mt-2 text-gray-600">{config.description}</p>
        </div>
      </div>

      {/* Summary Stats */}
      {config.stats && config.stats.cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {config.stats.cards.map((card) => (
            <div
              key={card.key}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {card.icon && (
                    <div
                      style={{
                        color: card.color || "var(--color-primary-600)",
                      }}
                    >
                      {card.icon}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading
                      ? "..."
                      : stats
                      ? card.getValue(stats)
                      : 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls Row */}
      <div className="mb-6 flex items-center gap-4">
        {/* Search Field - Takes remaining space */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* All Other Controls - Fixed width */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Table size={16} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "card"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showFilters
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4 mr-2 inline" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Action Buttons */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          {config.onAdd && (
            <button
              onClick={config.onAdd}
              className="inline-flex items-center px-4 py-2 text-white rounded-md transition-colors"
              style={{
                backgroundColor: "var(--color-primary-600)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-primary-700)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-primary-600)";
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              {config.addButtonLabel || "Add"}
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <GenericFilters
          filters={filters}
          filterConfig={config.filterConfig}
          onFiltersChange={onFiltersChange}
          onClearFilters={onClearFilters}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error loading data
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {!error && (
        <div
          ref={contentRef}
          style={{ minHeight: minHeight ? `${minHeight}px` : undefined }}
        >
          {viewMode === "table" ? (
            <div className="bg-white rounded-lg shadow border relative">
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Loading...</p>
                  </div>
                </div>
              )}
              <GenericDataTable
                data={data}
                columns={config.columns}
                loading={loading}
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                onSortChange={onSortChange}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                customActions={config.actions}
                emptyStateIcon={config.emptyStateIcon}
                emptyStateMessage={config.emptyStateMessage}
                sortBy={sortBy}
                sortOrder={sortOrder}
                title={config.title}
              />
            </div>
          ) : (
            // Card view - for now just show a placeholder message
            // Can be extended later with card rendering
            <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">
              Card view not yet implemented. Please use table view.
            </div>
          )}

          {/* Pagination for table view */}
          {viewMode === "table" && pagination && (
            <PaginationComponent
              pagination={pagination}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          )}
        </div>
      )}

      {/* Form Modal (Create/Edit) - Domain-specific */}
      {FormModal && (
        <FormModal
          isOpen={formModalOpen}
          onClose={onCloseFormModal}
          mode={formMode}
          {...(getFormModalProps
            ? getFormModalProps(selectedItem, formMode)
            : selectedItem
            ? { [config.title.toLowerCase().slice(0, -1)]: selectedItem }
            : {})}
        />
      )}

      {/* View Modal - Domain-specific */}
      {ViewModal && (
        <ViewModal
          isOpen={viewModalOpen}
          onClose={onCloseViewModal}
          {...(getViewModalProps
            ? getViewModalProps(selectedItem)
            : selectedItem
            ? { [config.title.toLowerCase().slice(0, -1)]: selectedItem }
            : {})}
        />
      )}
    </div>
  );
}

export default DataManagementContent;

