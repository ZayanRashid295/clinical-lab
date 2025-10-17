import React, { useState } from "react";
import { Plus, RefreshCw, Download } from "lucide-react";
import {
  Vehicle,
  VehicleFilters as VehicleFiltersType,
} from "../../types/fleet";
import { useVehicles } from "../../../hooks/fleet";
import { VehiclesTable, VehicleFilters, VehicleDetailsModal } from "../Fleet";

export default function VehiclesContent() {
  console.log("VehiclesContent component is rendering");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Use vehicles hook
  const {
    vehicles,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useVehicles({
    page: 1,
    limit: 10,
  });

  const handleFiltersChange = (newFilters: Partial<VehicleFiltersType>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      make: undefined,
      model: undefined,
      yearFrom: undefined,
      yearTo: undefined,
      mileageFrom: undefined,
      mileageTo: undefined,
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

  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleModal(true);
  };

  const handleCloseModal = () => {
    setShowVehicleModal(false);
    setSelectedVehicle(null);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    console.log("Edit vehicle:", vehicle);
    // TODO: Open edit vehicle modal
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    console.log("Delete vehicle:", vehicle);
    // TODO: Show confirmation dialog and delete
  };

  const handleCreateVehicle = () => {
    console.log("Create new vehicle");
    // TODO: Open create vehicle modal
  };

  const handleExportVehicles = () => {
    console.log("Export vehicles");
    // TODO: Implement export functionality
  };

  // Calculate stats
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE").length;
  const maintenanceVehicles = vehicles.filter(
    (v) => v.status === "MAINTENANCE"
  ).length;
  const inactiveVehicles = vehicles.filter(
    (v) => v.status === "INACTIVE"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Vehicles</h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor your fleet vehicles
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
              onClick={handleExportVehicles}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={handleCreateVehicle}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Vehicles
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalVehicles}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-semibold">🚗</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeVehicles}
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
                In Maintenance
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {maintenanceVehicles}
              </p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm font-semibold">🔧</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {inactiveVehicles}
              </p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm font-semibold">⏸️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <VehicleFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Vehicles Table */}
      <VehiclesTable
        vehicles={vehicles}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        onViewVehicle={handleViewVehicle}
        onEditVehicle={handleEditVehicle}
        onDeleteVehicle={handleDeleteVehicle}
      />

      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        vehicle={selectedVehicle}
        isOpen={showVehicleModal}
        onClose={handleCloseModal}
        onEdit={handleEditVehicle}
        onDelete={handleDeleteVehicle}
      />
    </div>
  );
}
