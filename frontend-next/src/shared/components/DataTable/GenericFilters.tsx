import React from "react";
import { X } from "lucide-react";
import { GenericFiltersProps } from "./types";

/**
 * Generic Filters Component
 * 
 * A reusable filter component that can be configured for any filter type
 * through filter configuration props.
 */
function GenericFilters<TFilters extends Record<string, any>>({
  filters,
  filterConfig,
  onFiltersChange,
  onClearFilters,
}: GenericFiltersProps<TFilters>) {
  
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }
  );

  const handleFilterChange = (key: keyof TFilters, value: any) => {
    onFiltersChange({ [key]: value } as unknown as Partial<TFilters>);
  };

  const removeFilter = (key: keyof TFilters) => {
    onFiltersChange({ [key]: undefined } as unknown as Partial<TFilters>);
  };

  const renderFilterField = (field: typeof filterConfig.fields[0]) => {
    const fieldValue = filters[field.key];
    const fieldId = `filter-${String(field.key)}`;

    switch (field.type) {
      case "text":
        return (
          <div key={String(field.key)}>
            <label
              htmlFor={fieldId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
            </label>
            <input
              type="text"
              id={fieldId}
              value={fieldValue || ""}
              onChange={(e) =>
                handleFilterChange(field.key, e.target.value || undefined)
              }
              placeholder={field.placeholder}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case "select":
        return (
          <div key={String(field.key)}>
            <label
              htmlFor={fieldId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
            </label>
            <select
              id={fieldId}
              value={fieldValue || ""}
              onChange={(e) =>
                handleFilterChange(field.key, e.target.value || undefined)
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All {field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "date":
        return (
          <div key={String(field.key)}>
            <label
              htmlFor={fieldId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
            </label>
            <input
              type="date"
              id={fieldId}
              value={fieldValue || ""}
              onChange={(e) =>
                handleFilterChange(field.key, e.target.value || undefined)
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case "dateRange":
        // For dateRange, we expect the field.key to be the base name
        // and we'll look for dateFrom and dateTo variants
        const fromKey = `${String(field.key)}From` as keyof TFilters;
        const toKey = `${String(field.key)}To` as keyof TFilters;
        return (
          <div key={String(field.key)} className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`${fieldId}-from`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.label} From
              </label>
              <input
                type="date"
                id={`${fieldId}-from`}
                value={filters[fromKey] || ""}
                onChange={(e) =>
                  handleFilterChange(fromKey, e.target.value || undefined)
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor={`${fieldId}-to`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.label} To
              </label>
              <input
                type="date"
                id={`${fieldId}-to`}
                value={filters[toKey] || ""}
                onChange={(e) =>
                  handleFilterChange(toKey, e.target.value || undefined)
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );

      case "multiselect":
        const selectedValues = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <div key={String(field.key)}>
            <label
              htmlFor={fieldId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
            </label>
            <select
              id={fieldId}
              multiple
              value={selectedValues}
              onChange={(e) => {
                const values = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );
                handleFilterChange(field.key, values.length > 0 ? values : undefined);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const layoutClass =
    filterConfig.layout === "row"
      ? "flex flex-wrap gap-4"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <div className="bg-white rounded-lg shadow border p-6 mb-6">
      <div className={layoutClass}>
        {filterConfig.fields.map(renderFilterField)}
        
        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {filterConfig.showActiveFilters !== false && hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filterConfig.fields.map((field) => {
              const fieldValue = filters[field.key];
              if (
                fieldValue === undefined ||
                fieldValue === null ||
                fieldValue === "" ||
                (Array.isArray(fieldValue) && fieldValue.length === 0)
              ) {
                return null;
              }

              let displayValue: string;
              if (field.type === "dateRange") {
                const fromKey = `${String(field.key)}From` as keyof TFilters;
                const toKey = `${String(field.key)}To` as keyof TFilters;
                const fromValue = filters[fromKey];
                const toValue = filters[toKey];
                if (!fromValue && !toValue) return null;
                displayValue = `${fromValue || "∞"} - ${toValue || "∞"}`;
              } else if (field.type === "multiselect") {
                displayValue = Array.isArray(fieldValue)
                  ? fieldValue.join(", ")
                  : String(fieldValue);
              } else if (field.type === "select" && field.options) {
                const option = field.options.find(
                  (opt) => opt.value === String(fieldValue)
                );
                displayValue = option?.label || String(fieldValue);
              } else {
                displayValue = String(fieldValue);
              }

              return (
                <span
                  key={String(field.key)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {field.label}: {displayValue}
                  <button
                    onClick={() => {
                      if (field.type === "dateRange") {
                        const fromKey = `${String(field.key)}From` as keyof TFilters;
                        const toKey = `${String(field.key)}To` as keyof TFilters;
                        removeFilter(fromKey);
                        removeFilter(toKey);
                      } else {
                        removeFilter(field.key);
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default GenericFilters;

