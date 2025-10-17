import React, { useState } from "react";
import {
  Plus,
  RefreshCw,
  Download,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Payout, PayoutFilters as PayoutFiltersType } from "../../types/payout";
import usePayouts from "../../../hooks/usePayouts";
import PayoutsTable from "../Payments/PayoutsTable";
import { sumAmounts, formatNumber } from "../../../utils/currency";

export default function PayoutsContent() {
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  const {
    payouts,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = usePayouts({
    page: 1,
    limit: 10,
  });

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    updateFilters({ limit: pageSize, page: 1 });
  };

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    updateFilters({ sortBy, sortOrder });
  };

  const handleViewPayout = (payout: Payout) => {
    setSelectedPayout(payout);
    console.log("View payout:", payout);
  };

  const handleProcessPayout = (payout: Payout) => {
    console.log("Process payout:", payout);
  };

  const handleRetryPayout = (payout: Payout) => {
    console.log("Retry payout:", payout);
  };

  const handleExportPayouts = () => {
    console.log("Export payouts");
  };

  const handleRefresh = () => {
    refetch();
  };

  // Calculate stats
  const totalPayouts = payouts.length;
  const completedPayouts = payouts.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const pendingPayouts = payouts.filter((p) => p.status === "PENDING").length;
  const totalAmount = sumAmounts(
    payouts.filter((p) => p.status === "COMPLETED").map((p) => p.amount)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Payouts</h1>
            <p className="text-gray-600 mt-1">
              Manage driver payouts and earnings distribution
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleExportPayouts}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Plus size={16} />
              Process Payouts
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payouts</p>
              <p className="text-2xl font-bold text-gray-900">{totalPayouts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedPayouts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingPayouts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${formatNumber(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow border">
        <PayoutsTable
          payouts={payouts}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
          onViewPayout={handleViewPayout}
          onProcessPayout={handleProcessPayout}
          onRetryPayout={handleRetryPayout}
          title="Driver Payouts"
        />
      </div>
    </div>
  );
}
