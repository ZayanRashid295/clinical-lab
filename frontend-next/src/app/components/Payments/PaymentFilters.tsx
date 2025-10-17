import React from "react";
import { Search, X } from "lucide-react";
import {
  PaymentFilters as PaymentFiltersType,
  PaymentStatus,
  PaymentMethodType,
} from "../../types/payment";

interface PaymentFiltersProps {
  filters: PaymentFiltersType;
  onFiltersChange: (filters: Partial<PaymentFiltersType>) => void;
  onClearFilters: () => void;
}

const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const paymentStatuses: PaymentStatus[] = [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "REFUNDED",
  ];

  const paymentMethods: PaymentMethodType[] = [
    "CARD",
    "WALLET",
    "CASH",
    "BANK_TRANSFER",
  ];

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "" && value !== null
  );

  return (
    <div className="bg-white rounded-lg shadow border p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-1">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              placeholder="Transaction ID, customer name, email..."
              value={filters.search || ""}
              onChange={(e) =>
                onFiltersChange({ search: e.target.value || undefined })
              }
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            value={filters.status || ""}
            onChange={(e) =>
              onFiltersChange({
                status: (e.target.value as PaymentStatus) || undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label
            htmlFor="method"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Payment Method
          </label>
          <select
            id="method"
            value={filters.method || ""}
            onChange={(e) =>
              onFiltersChange({
                method: (e.target.value as PaymentMethodType) || undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Methods</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method
                  .replace("_", " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
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

      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div>
          <label
            htmlFor="dateFrom"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date From
          </label>
          <input
            type="date"
            id="dateFrom"
            value={filters.dateFrom || ""}
            onChange={(e) =>
              onFiltersChange({ dateFrom: e.target.value || undefined })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="dateTo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date To
          </label>
          <input
            type="date"
            id="dateTo"
            value={filters.dateTo || ""}
            onChange={(e) =>
              onFiltersChange({ dateTo: e.target.value || undefined })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="minAmount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Min Amount ($)
          </label>
          <input
            type="number"
            id="minAmount"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={filters.minAmount || ""}
            onChange={(e) =>
              onFiltersChange({
                minAmount: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="maxAmount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Max Amount ($)
          </label>
          <input
            type="number"
            id="maxAmount"
            min="0"
            step="0.01"
            placeholder="1000.00"
            value={filters.maxAmount || ""}
            onChange={(e) =>
              onFiltersChange({
                maxAmount: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Status: {filters.status}
                <button
                  onClick={() => onFiltersChange({ status: undefined })}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.method && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Method: {filters.method.replace("_", " ")}
                <button
                  onClick={() => onFiltersChange({ method: undefined })}
                  className="text-green-600 hover:text-green-800"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                Search: &quot;{filters.search}&quot;
                <button
                  onClick={() => onFiltersChange({ search: undefined })}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {(filters.minAmount || filters.maxAmount) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                Amount: ${filters.minAmount || 0} - ${filters.maxAmount || "∞"}
                <button
                  onClick={() =>
                    onFiltersChange({
                      minAmount: undefined,
                      maxAmount: undefined,
                    })
                  }
                  className="text-orange-600 hover:text-orange-800"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFilters;
