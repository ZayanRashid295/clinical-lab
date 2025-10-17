import React, { useState } from "react";
import {
  Plus,
  RefreshCw,
  Download,
  Users,
  Star,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { Driver, DriverFilters as DriverFiltersType } from "../../types/fleet";
import { useDrivers } from "../../../hooks/fleet";

export default function DriversContent() {
  const [showFilters, setShowFilters] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Use drivers hook
  const {
    drivers,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useDrivers({
    page: 1,
    limit: 10,
  });

  const handleFiltersChange = (newFilters: Partial<DriverFiltersType>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      ratingFrom: undefined,
      ratingTo: undefined,
      ridesFrom: undefined,
      ridesTo: undefined,
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

  const handleViewDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDriverModal(true);
  };

  const handleCloseModal = () => {
    setShowDriverModal(false);
    setSelectedDriver(null);
  };

  const handleEditDriver = (driver: Driver) => {
    console.log("Edit driver:", driver);
    // TODO: Open edit driver modal
  };

  const handleDeleteDriver = (driver: Driver) => {
    console.log("Delete driver:", driver);
    // TODO: Show confirmation dialog and delete
  };

  const handleCreateDriver = () => {
    console.log("Create new driver");
    // TODO: Open create driver modal
  };

  const handleExportDrivers = () => {
    console.log("Export drivers");
    // TODO: Implement export functionality
  };

  // Calculate stats
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter((d) => d.status === "ACTIVE").length;
  const suspendedDrivers = drivers.filter(
    (d) => d.status === "SUSPENDED"
  ).length;
  const pendingDrivers = drivers.filter((d) => d.status === "PENDING").length;
  const averageRating =
    drivers.length > 0
      ? (
          drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length
        ).toFixed(1)
      : "0.0";

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
      SUSPENDED: { bg: "bg-red-100", text: "text-red-800", label: "Suspended" },
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
      INACTIVE: { bg: "bg-gray-100", text: "text-gray-800", label: "Inactive" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const isLicenseExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Drivers</h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor your fleet drivers
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
              onClick={handleExportDrivers}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={handleCreateDriver}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add Driver
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{totalDrivers}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeDrivers}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-semibold">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">
                {suspendedDrivers}
              </p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm font-semibold">⏸️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageRating}
              </p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star size={16} className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name, email, or license..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    handleFiltersChange({ search: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ""}
                  onChange={(e) =>
                    handleFiltersChange({
                      status: (e.target.value as any) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="PENDING">Pending</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <input
                  type="number"
                  placeholder="Min rating"
                  min="0"
                  max="5"
                  step="0.1"
                  value={filters.ratingFrom || ""}
                  onChange={(e) =>
                    handleFiltersChange({
                      ratingFrom: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Drivers Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading drivers...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {driver.name}
                        </h3>
                        <p className="text-sm text-gray-600">{driver.email}</p>
                      </div>
                    </div>
                    {getStatusBadge(driver.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={14} className="mr-2" />
                      {driver.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail size={14} className="mr-2" />
                      {driver.email}
                    </div>
                    {driver.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={14} className="mr-2" />
                        <span className="truncate">
                          {driver.location.address}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {driver.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {driver.totalRides} rides
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      License: {driver.licenseNumber}
                    </div>
                    <div
                      className={`text-sm ${
                        isLicenseExpired(driver.licenseExpiry)
                          ? "text-red-600 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      Expires: {formatDate(driver.licenseExpiry)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      Earnings: {formatCurrency(driver.totalEarnings)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDriver(driver)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditDriver(driver)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {drivers.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No drivers found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first driver.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
