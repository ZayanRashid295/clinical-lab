"use client";

import React, { useState } from "react";
import { RefreshCw, Download, Eye, Filter } from "lucide-react";
import { Payment } from "@/shared/types/payment";
import { usePayments } from "@/shared/hooks/use-payments";
import PaymentHistoryTable from "./payment-history-table";
import PaymentFilters from "./payment-filters";
import { Button } from "@/components/ui/button";

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
    clearFilters,
  } = usePayments({
    page: 1,
    limit: 10, // Show 10 records per page
  });

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    clearFilters();
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
    // TODO: Open payment details modal or navigate to payment details page
    console.log("View payment:", payment);
  };

  const handleRefundPayment = (payment: Payment) => {
    // TODO: Implement refund functionality
    console.log("Refund payment:", payment);
  };

  const handleExportPayments = () => {
    // TODO: Implement export functionality
    console.log("Export payments");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Payment History
            </h1>
            <p className="mt-2 text-gray-600">
              View and manage all payment transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter size={16} />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPayments}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
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
        <PaymentHistoryTable
          payments={payments}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
          onViewPayment={handleViewPayment}
          onRefundPayment={handleRefundPayment}
          title="Payment History"
        />
      </div>

      {/* Payment Details Modal (TODO) */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Payment Details</h3>
              <Button
                variant="outline"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Transaction ID
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedPayment.transactionId || selectedPayment.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <p className="text-sm text-gray-900">
                    ${selectedPayment.amount} {selectedPayment.currency}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedPayment.status}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Method
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedPayment.method}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Customer
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedPayment.user?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedPayment.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedPayment.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

