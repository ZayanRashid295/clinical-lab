"use client";

import React, { useState } from "react";
import { Search, Filter, X, Calendar, DollarSign } from "lucide-react";
import {
  PaymentFilters,
  PaymentStatus,
  PaymentMethodType,
} from "@/shared/types/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentFiltersProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: Partial<PaymentFilters>) => void;
  onClearFilters: () => void;
}

const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ status: (value as PaymentStatus) || undefined });
  };

  const handleMethodChange = (value: string) => {
    onFiltersChange({ method: (value as PaymentMethodType) || undefined });
  };

  const handleDateFromChange = (value: string) => {
    onFiltersChange({ dateFrom: value || undefined });
  };

  const handleDateToChange = (value: string) => {
    onFiltersChange({ dateTo: value || undefined });
  };

  const handleMinAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    onFiltersChange({ minAmount: isNaN(numValue) ? undefined : numValue });
  };

  const handleMaxAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    onFiltersChange({ maxAmount: isNaN(numValue) ? undefined : numValue });
  };

  const hasActiveFilters = () => {
    return !!(
      filters.search ||
      filters.status ||
      filters.method ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.minAmount ||
      filters.maxAmount
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Filter size={20} />
            Payment Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={16} className="mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide" : "Show"} Advanced
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Search</label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder="Search transactions, users..."
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select
              value={filters.status || ""}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <Select
              value={filters.method || ""}
              onValueChange={handleMethodChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All methods</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="WALLET">Wallet</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar size={16} />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      placeholder="From date"
                      value={filters.dateFrom || ""}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      placeholder="To date"
                      value={filters.dateTo || ""}
                      onChange={(e) => handleDateToChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign size={16} />
                  Amount Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min amount"
                      value={filters.minAmount || ""}
                      onChange={(e) => handleMinAmountChange(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max amount"
                      value={filters.maxAmount || ""}
                      onChange={(e) => handleMaxAmountChange(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">
                Active filters:
              </span>
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: {filters.search}
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Status: {filters.status}
                </span>
              )}
              {filters.method && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Method: {filters.method}
                </span>
              )}
              {filters.dateFrom && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  From: {new Date(filters.dateFrom).toLocaleDateString()}
                </span>
              )}
              {filters.dateTo && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  To: {new Date(filters.dateTo).toLocaleDateString()}
                </span>
              )}
              {filters.minAmount && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Min: ${filters.minAmount}
                </span>
              )}
              {filters.maxAmount && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Max: ${filters.maxAmount}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentFilters;

