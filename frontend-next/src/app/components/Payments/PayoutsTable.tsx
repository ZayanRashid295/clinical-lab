import React from "react";
import Image from "next/image";
import {
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CreditCard,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Payout, PayoutStatus } from "../../types/payout";
import { formatCurrency } from "../../../utils/currency";

interface PayoutsTableProps {
  payouts: Payout[];
  loading?: boolean;
  error?: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onViewPayout?: (payout: Payout) => void;
  onProcessPayout?: (payout: Payout) => void;
  onRetryPayout?: (payout: Payout) => void;
  title?: string;
}

const PayoutsTable: React.FC<PayoutsTableProps> = ({
  payouts,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onViewPayout,
  onProcessPayout,
  onRetryPayout,
  title = "Driver Payouts",
}) => {
  const getStatusColor = (status: PayoutStatus): string => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: PayoutStatus) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle size={16} className="text-green-600" />;
      case "FAILED":
        return <XCircle size={16} className="text-red-600" />;
      case "PROCESSING":
        return <Clock size={16} className="text-blue-600" />;
      case "PENDING":
        return <AlertCircle size={16} className="text-yellow-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getPayoutMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "bank_transfer":
        return <Building size={16} />;
      case "paypal":
        return <CreditCard size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const formatPayoutMethod = (method: string): string => {
    return method
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Payouts
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {pagination && (
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} payouts
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Processed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin h-6 w-6 text-gray-400 mr-2" />
                    <span className="text-gray-500">Loading payouts...</span>
                  </div>
                </td>
              </tr>
            ) : payouts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      No payouts found
                    </h3>
                    <p className="text-sm">
                      No payouts match your current filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {payout.driver?.avatar ? (
                          <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={payout.driver.avatar}
                            alt={`${payout.driver?.firstName || ""} ${
                              payout.driver?.lastName || ""
                            }`.trim()}
                            width={40}
                            height={40}
                            unoptimized
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {payout.driver?.firstName?.[0] || "?"}
                              {payout.driver?.lastName?.[0] || ""}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {/* {payout.driver?.firstName && payout.driver?.lastName
                            ? `${payout.driver.firstName} ${payout.driver.lastName}`
                            : payout.driver?.name || "Unknown Driver"} */}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payout.driver?.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {payout.driverId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payout.amount, payout.currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {payout.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getPayoutMethodIcon(payout.payoutMethod)}
                      <span className="text-sm text-gray-900">
                        {formatPayoutMethod(payout.payoutMethod)}
                      </span>
                    </div>
                    {payout.transactionId && (
                      <div className="text-xs text-gray-500 mt-1">
                        {payout.transactionId}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payout.status)}
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          payout.status
                        )}`}
                      >
                        {payout.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payout.scheduledAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payout.processedAt ? formatDate(payout.processedAt) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewPayout?.(payout)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {payout.status === "PENDING" && onProcessPayout && (
                        <button
                          onClick={() => onProcessPayout(payout)}
                          className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                          title="Process Now"
                        >
                          Process
                        </button>
                      )}
                      {payout.status === "FAILED" && onRetryPayout && (
                        <button
                          onClick={() => onRetryPayout(payout)}
                          className="text-orange-600 hover:text-orange-900 text-xs px-2 py-1 border border-orange-300 rounded hover:bg-orange-50"
                          title="Retry Payout"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-700">
                Show:
              </label>
              <select
                id="pageSize"
                value={pagination.limit}
                onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700">per page</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.page) <= 2
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => onPageChange?.(page)}
                        className={`px-3 py-1 border rounded text-sm ${
                          page === pagination.page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsTable;
