import React from "react";
import {
  Eye,
  RefreshCw,
  Edit,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Trash2,
  Ban,
} from "lucide-react";
import { GenericDataTableProps, ColumnConfig } from "./types";

/**
 * Generic Data Table Component
 * 
 * A reusable table component that can be configured for any data type
 * through column configuration props.
 */
function GenericDataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  error = null,
  pagination,
  sortBy,
  sortOrder,
  onSortChange,
  onView,
  onEdit,
  onDelete,
  onDeactivate,
  onDeletePermanent,
  selectionMode = false,
  selectedIds = [],
  onSelectionChange,
  customActions = [],
  emptyStateIcon,
  emptyStateMessage = "No items found",
  title,
}: GenericDataTableProps<T>) {
  
  const handleSort = (columnKey: string, sortKey?: string) => {
    if (!onSortChange) return;
    const actualSortKey = sortKey || columnKey;

    if (sortBy === actualSortKey) {
      // Toggle sort order if clicking the same column
      onSortChange(actualSortKey, sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Default to ascending for new column
      onSortChange(actualSortKey, "asc");
    }
  };

  const getSortIcon = (columnKey: string, sortKey?: string) => {
    const actualSortKey = sortKey || columnKey;
    if (sortBy !== actualSortKey) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 text-blue-600" />
    );
  };

  const getValue = (row: T, column: ColumnConfig<T>): any => {
    const keys = column.key.split(".");
    let value: any = row;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  };

  const hasActions =
    onView ||
    onEdit ||
    onDelete ||
    onDeactivate ||
    onDeletePermanent ||
    customActions.length > 0;

  const pageIds = data.map((row) => row.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someOnPageSelected = pageIds.some((id) => selectedIds.includes(id));

  const toggleRowSelected = (id: string) => {
    if (!onSelectionChange) return;
    const set = new Set(selectedIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onSelectionChange(Array.from(set));
  };

  const toggleSelectAllOnPage = () => {
    if (!onSelectionChange) return;
    if (allOnPageSelected) {
      onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...pageIds])]);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const totalColumns =
    columns.length + (selectionMode ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectionMode && (
                <th className="px-3 py-3 w-10 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected;
                    }}
                    onChange={toggleSelectAllOnPage}
                    aria-label="Select all on this page"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable !== false ? "cursor-pointer hover:bg-gray-100" : ""
                  }`}
                  style={{
                    width: column.width,
                    textAlign: column.align || "left",
                  }}
                  onClick={() =>
                    column.sortable !== false &&
                    handleSort(column.key, column.sortKey)
                  }
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable !== false &&
                      getSortIcon(column.key, column.sortKey)}
                  </div>
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={totalColumns} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin h-6 w-6 text-gray-400 mr-2" />
                    <span className="text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    {emptyStateIcon || (
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    )}
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      {emptyStateMessage}
                    </h3>
                    <p className="text-sm">
                      No items match your current filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {selectionMode && (
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleRowSelected(row.id)}
                        aria-label={`Select row ${row.id}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = getValue(row, column);
                    return (
                      <td
                        key={column.key}
                        className={`px-6 py-4 ${
                          column.width === "nowrap" ? "whitespace-nowrap" : ""
                        }`}
                        style={{
                          textAlign: column.align || "left",
                        }}
                      >
                        {column.render
                          ? column.render(value, row, rowIndex)
                          : value !== null && value !== undefined
                          ? String(value)
                          : "-"}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            title="View Details"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1"
                            title="Edit"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                        )}
                        {onDeactivate && (
                          <button
                            type="button"
                            onClick={() => onDeactivate(row)}
                            className="text-amber-700 hover:text-amber-900 flex items-center gap-1"
                            title="Deactivate (hide)"
                          >
                            <Ban size={16} />
                            Deactivate
                          </button>
                        )}
                        {onDeletePermanent && (
                          <button
                            type="button"
                            onClick={() => onDeletePermanent(row)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            title="Delete permanently"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        )}
                        {onDelete && !onDeletePermanent && (
                          <button
                            onClick={() => onDelete(row)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 flex items-center justify-center"
                            title="Delete"
                          >
                            <X size={18} />
                          </button>
                        )}
                        {customActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => action.onClick(row)}
                            className={`flex items-center gap-1 ${
                              action.variant === "danger"
                                ? "text-red-600 hover:text-red-900"
                                : action.variant === "primary"
                                ? "text-blue-600 hover:text-blue-900"
                                : action.variant === "secondary"
                                ? "text-gray-600 hover:text-gray-900"
                                : "text-gray-600 hover:text-gray-900"
                            } ${action.className || ""}`}
                            title={action.label}
                          >
                            {action.icon}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GenericDataTable;

