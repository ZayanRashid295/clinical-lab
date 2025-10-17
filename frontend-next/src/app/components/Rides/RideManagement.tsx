import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Download } from "lucide-react";
import RidesTable from "./RidesTable";
import RideFilters from "./RideFilters";
import RideDetailsModal from "./RideDetailsModal";
import useRides from "../../../hooks/useRides";
import { Ride, RideStatus, RideQueryParams } from "../../types/ride";
import { RideHistoryFilters } from "../../services/ridehistory/ridehistory.types";

export type RideManagementMode =
  | "all"
  | "active"
  | "history"
  | "requests"
  | "analytics";

interface RideManagementProps {
  mode: RideManagementMode;
  title?: string;
  description?: string;
  showCreateButton?: boolean;
  showFilters?: boolean;
  showAnalytics?: boolean;
}

export default function RideManagement({
  mode,
  title,
  description,
  showCreateButton = false,
  showFilters = true,
  showAnalytics = false,
}: RideManagementProps) {
  const [showFiltersState, setShowFiltersState] = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showRideModal, setShowRideModal] = useState(false);

  // Determine default status filter based on mode
  const getDefaultStatus = (
    mode: RideManagementMode
  ): RideStatus | undefined => {
    switch (mode) {
      case "active":
        return "IN_PROGRESS";
      case "history":
        return "COMPLETED";
      case "requests":
        return "REQUESTED";
      default:
        return undefined; // 'all' and 'analytics' show all statuses
    }
  };

  // Use rides hook with mode-specific configuration
  const { rides, loading, error, pagination, refetch, updateFilters, filters } =
    useRides({
      page: 1,
      limit: 10,
      status: getDefaultStatus(mode),
    });

  // Get mode-specific configuration
  const getModeConfig = (mode: RideManagementMode) => {
    const configs = {
      all: {
        title: "Rides Management",
        description: "Monitor and manage ride requests across your platform",
        showCreateButton: true,
        exportMessage: "Export rides",
      },
      active: {
        title: "Active Rides",
        description: "Monitor and manage currently active rides",
        showCreateButton: false,
        exportMessage: "Export active rides",
      },
      history: {
        title: "Ride History",
        description:
          "View and analyze completed rides with comprehensive filtering and search capabilities",
        showCreateButton: false,
        exportMessage: "Export ride history",
      },
      requests: {
        title: "Ride Requests",
        description: "Manage incoming ride requests and assignments",
        showCreateButton: false,
        exportMessage: "Export ride requests",
      },
      analytics: {
        title: "Ride Analytics",
        description: "Performance insights and ride statistics",
        showCreateButton: false,
        exportMessage: "Export analytics",
      },
    };
    return configs[mode];
  };

  const modeConfig = getModeConfig(mode);
  const finalTitle = title || modeConfig.title;
  const finalDescription = description || modeConfig.description;
  const finalShowCreateButton = showCreateButton || modeConfig.showCreateButton;

  // Type conversion functions
  const convertToRideHistoryFilters = (
    queryParams: RideQueryParams
  ): RideHistoryFilters => ({
    ...queryParams,
    status: queryParams.status as string | undefined,
    startDate: queryParams.dateFrom,
    endDate: queryParams.dateTo,
  });

  const convertFromRideHistoryFilters = (
    filters: Partial<RideHistoryFilters>
  ): Partial<RideQueryParams> => ({
    ...filters,
    status: filters.status as RideStatus | undefined,
    dateFrom: filters.startDate,
    dateTo: filters.endDate,
  });

  const handleFiltersChange = (newFilters: Partial<RideHistoryFilters>) => {
    const convertedFilters = convertFromRideHistoryFilters(newFilters);
    updateFilters(convertedFilters);
  };

  const handleClearFilters = () => {
    const defaultStatus = getDefaultStatus(mode);
    updateFilters({
      search: undefined,
      status: defaultStatus,
      dateFrom: undefined,
      dateTo: undefined,
      minFare: undefined,
      maxFare: undefined,
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

  const handleViewRide = (ride: Ride) => {
    setSelectedRide(ride);
    setShowRideModal(true);
  };

  const handleCloseModal = () => {
    setShowRideModal(false);
    setSelectedRide(null);
  };

  const handleTrackRide = (ride: Ride) => {
    console.log("Track ride:", ride);
  };

  const handleMessageRide = (ride: Ride) => {
    console.log("Message ride:", ride);
  };

  const handleUpdateStatus = async (ride: Ride, status: RideStatus) => {
    try {
      console.log("Update status:", ride, status);
    } catch (error) {
      console.error("Error updating ride status:", error);
    }
  };

  const handleCreateRide = () => {
    console.log("Create new ride");
  };

  const handleExportRides = () => {
    console.log(modeConfig.exportMessage);
  };

  // Filter rides based on mode for requests view
  const getFilteredRides = () => {
    if (mode === "requests") {
      return rides.filter((ride) =>
        ["REQUESTED", "IN_PROGRESS", "ACCEPTED"].includes(ride.status)
      );
    }
    return rides;
  };

  const filteredRides = getFilteredRides();

  // Analytics calculations (only for analytics mode)
  const getAnalyticsData = () => {
    if (mode !== "analytics") return null;

    const completedRides = rides.filter((r) => r.status === "COMPLETED");
    const cancelledRides = rides.filter((r) => r.status === "CANCELLED");
    const totalRevenue = completedRides.reduce(
      (sum, r) => sum + (typeof r.fare === "number" ? r.fare : 0),
      0
    );
    const averageFare =
      completedRides.length > 0 ? totalRevenue / completedRides.length : 0;
    const completionRate =
      rides.length > 0 ? (completedRides.length / rides.length) * 100 : 0;
    const cancellationRate =
      rides.length > 0 ? (cancelledRides.length / rides.length) * 100 : 0;

    return {
      totalRides: rides.length,
      completedRides: completedRides.length,
      cancelledRides: cancelledRides.length,
      totalRevenue,
      averageFare,
      completionRate,
      cancellationRate,
    };
  };

  const analyticsData = getAnalyticsData();

  // Render analytics view
  if (mode === "analytics" && showAnalytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{finalTitle}</h1>
              <p className="text-gray-600 mt-1">{finalDescription}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Rides
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.totalRides}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">
                    📊
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analyticsData.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-semibold">
                    💰
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.completionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-semibold">
                    ✓
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Average Fare
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analyticsData.averageFare.toFixed(2)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-semibold">
                    💵
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rides Table for Analytics */}
        <div className="bg-white rounded-lg shadow border">
          <RidesTable
            rides={filteredRides}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSortChange={handleSortChange}
            onViewRide={handleViewRide}
            onTrackRide={handleTrackRide}
            onMessageRide={handleMessageRide}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>

        {/* Ride Details Modal */}
        <RideDetailsModal
          ride={selectedRide}
          isOpen={showRideModal}
          onClose={handleCloseModal}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    );
  }

  // Render standard rides view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{finalTitle}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{finalDescription}</p>
          </div>
          <div className="flex items-center gap-3">
            {showFilters && (
              <button
                onClick={() => setShowFiltersState(!showFiltersState)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  showFiltersState
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {showFiltersState ? "Hide Filters" : "Show Filters"}
              </button>
            )}
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleExportRides}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
            {finalShowCreateButton && (
              <button
                onClick={handleCreateRide}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Create Ride
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards for Requests Mode */}
      {mode === "requests" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rides.filter((r) => r.status === "REQUESTED").length}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm font-semibold">
                  ⏰
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Accepted Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rides.filter((r) => r.status === "ACCEPTED").length}
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
                <p className="text-sm font-medium text-gray-600">
                  Assigned Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rides.filter((r) => r.status === "IN_PROGRESS").length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">🚗</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && showFiltersState && (
        <div className="mb-6">
          <RideFilters
            filters={convertToRideHistoryFilters(filters)}
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

      {/* Rides Table */}
      <div className="bg-white rounded-lg shadow border">
        <RidesTable
          rides={filteredRides}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
          onViewRide={handleViewRide}
          onTrackRide={handleTrackRide}
          onMessageRide={handleMessageRide}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      {/* Ride Details Modal */}
      <RideDetailsModal
        ride={selectedRide}
        isOpen={showRideModal}
        onClose={handleCloseModal}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
