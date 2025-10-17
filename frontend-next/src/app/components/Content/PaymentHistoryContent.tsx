import React, { useState } from "react";
import { Plus, RefreshCw, Download } from "lucide-react";
import {
  Payment,
  PaymentFilters as PaymentFiltersType,
} from "../../types/payment";
import usePayments from "../../../hooks/usePayments";
import PaymentsTable from "../Payments/PaymentsTable";
import PaymentFilters from "../Payments/PaymentFilters";

export default function PaymentHistoryContent() {
  const [showFilters, setShowFilters] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const {
    payments,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = usePayments({
    page: 1,
    limit: 10,
  });

  const handleFiltersChange = (newFilters: Partial<PaymentFiltersType>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      method: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    updateFilters({ limit: pageSize, page: 1 });
  };

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    updateFilters({ sortBy, sortOrder });
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    // TODO: Open payment details modal
    console.log("View payment:", payment);
  };

  const handleExportPayments = () => {
    console.log("Export payments");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment History
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage payment transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                showFilters
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleExportPayments}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6">
          <PaymentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow border">
        <PaymentsTable
          payments={payments}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
          onViewPayment={handleViewPayment}
          title="Payment History"
        />
      </div>
    </div>
  );
}
