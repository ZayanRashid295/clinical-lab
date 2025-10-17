"use client";

import React from "react";
import {
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CreditCard,
  Wallet,
  Banknote,
  Building,
} from "lucide-react";
import {
  Payment,
  PaymentStatus,
  PaymentMethodType,
} from "@/shared/types/payment";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PaymentHistoryTableProps {
  payments: Payment[];
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
  onViewPayment?: (payment: Payment) => void;
  onRefundPayment?: (payment: Payment) => void;
  title?: string;
}

const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  payments,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onViewPayment,
  onRefundPayment,
  title = "Payment History",
}) => {
  const getStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "REFUNDED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMethodIcon = (method: PaymentMethodType) => {
    switch (method) {
      case "CARD":
        return <CreditCard size={16} />;
      case "WALLET":
        return <Wallet size={16} />;
      case "CASH":
        return <Banknote size={16} />;
      case "BANK_TRANSFER":
        return <Building size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
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

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Payments
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
              of {pagination.total} payments
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin h-6 w-6 text-gray-400 mr-2" />
                    <span className="text-gray-500">Loading payments...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="text-gray-500">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      No payments found
                    </h3>
                    <p className="text-sm">
                      No payments match your current filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.transactionId || payment.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.description || "Payment transaction"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.user?.name ||
                          (payment.user?.firstName && payment.user?.lastName
                            ? `${payment.user.firstName} ${payment.user.lastName}`
                            : "Unknown User")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.user?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {payment.gateway}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMethodIcon(payment.method)}
                      <span className="text-sm text-gray-900 capitalize">
                        {payment.method.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(payment.status)}
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(payment.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewPayment?.(payment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={16} />
                      </Button>
                      {payment.status === "COMPLETED" && onRefundPayment && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRefundPayment(payment)}
                          className="text-orange-600 hover:text-orange-900 border-orange-300 hover:bg-orange-50"
                        >
                          Refund
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

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
                      <Button
                        variant={
                          page === pagination.page ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => onPageChange?.(page)}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryTable;
