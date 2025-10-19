import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../../src/shared";
import { getMenuItemsForRole, MenuItem } from "../../src/app/types/menu";
import { MOCK_FUEL_RECORDS, MOCK_VEHICLES } from "../../src/data/mockData";
import {
  Fuel,
  Car,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Zap,
} from "lucide-react";

export default function FuelTrackingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [filteredRecords, setFilteredRecords] = useState(MOCK_FUEL_RECORDS);

  const findMenuItemByPath = useCallback(
    (items: MenuItem[], path: string): MenuItem | null => {
      for (const item of items) {
        if (item.path === path) {
          return item;
        }
        if (item.submenu) {
          const found = findMenuItemByPath(item.submenu, path);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  useEffect(() => {
    // Check authentication status
    if (!authService.isAuthenticated()) {
      router.replace("/login");
      return;
    } else {
      setIsLoading(false);
    }

    // Find the menu item for this route
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const menuItems = getMenuItemsForRole(currentUser.roles || []);
      const foundItem = findMenuItemByPath(menuItems, "/fleet/fuel");
      setMenuItem(foundItem);
    }
  }, [router, findMenuItemByPath]);

  useEffect(() => {
    // Filter fuel records based on search term and vehicle
    let filtered = MOCK_FUEL_RECORDS;

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.driverName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (vehicleFilter !== "ALL") {
      filtered = filtered.filter(
        (record) => record.vehicleId === vehicleFilter
      );
    }

    setFilteredRecords(filtered);
  }, [searchTerm, vehicleFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getTotalFuelCost = () => {
    return MOCK_FUEL_RECORDS.reduce((sum, record) => sum + record.cost, 0);
  };

  const getTotalFuelAmount = () => {
    return MOCK_FUEL_RECORDS.reduce(
      (sum, record) => sum + record.fuelAmount,
      0
    );
  };

  const getAveragePricePerGallon = () => {
    const totalCost = getTotalFuelCost();
    const totalAmount = getTotalFuelAmount();
    return totalAmount > 0 ? totalCost / totalAmount : 0;
  };

  const getFuelEfficiency = () => {
    // Mock calculation - in real app, this would be based on actual mileage data
    return 25.5; // MPG
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const totalCost = getTotalFuelCost();
  const totalAmount = getTotalFuelAmount();
  const averagePrice = getAveragePricePerGallon();
  const fuelEfficiency = getFuelEfficiency();

  return (
    <>
      <Head>
        <title>Fuel Tracking - Uber Portal</title>
        <meta name="description" content="Track fleet fuel consumption" />
      </Head>

      <MenuSystem
        applicationTitle="Uber Portal"
        searchPlaceholder="Search fuel records..."
        enableSearch={true}
        customContent={{
          "fuel-tracking": () => (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Fuel Tracking
                    </h1>
                    <p className="mt-2 text-gray-600">
                      Monitor fuel consumption and costs
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      /* Add fuel record functionality */
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Fuel Record
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Total Fuel Cost
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalCost)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Fuel className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Total Fuel
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {totalAmount.toFixed(1)} gal
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Avg Price/Gal
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(averagePrice)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Zap className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Fuel Efficiency
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {fuelEfficiency} MPG
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search fuel records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ALL">All Vehicles</option>
                      {MOCK_VEHICLES.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} -{" "}
                          {vehicle.licensePlate}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Fuel Records */}
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                          <Fuel className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {record.vehicleInfo}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {record.location}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-600">
                              Driver: {record.driverName}
                            </span>
                            <span className="text-sm text-gray-600">
                              Mileage: {record.mileage.toLocaleString()} mi
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(record.cost)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(record.date)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Fuel Amount
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {record.fuelAmount} gal
                          </span>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Price/Gallon
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(record.pricePerGallon)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Total Cost
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(record.cost)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(record.date)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            /* View details */
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            /* Edit record */
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            /* Delete record */
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <Fuel className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No fuel records found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || vehicleFilter !== "ALL"
                      ? "Try adjusting your search or filter criteria."
                      : "Get started by adding your first fuel record."}
                  </p>
                </div>
              )}

              {/* Fuel Analytics */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fuel Cost Trend */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Fuel Cost Trend
                    </h3>
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      Chart placeholder - Fuel cost trend over time
                    </p>
                  </div>
                </div>

                {/* Vehicle Fuel Efficiency */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Vehicle Fuel Efficiency
                    </h3>
                    <Zap className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    {MOCK_VEHICLES.slice(0, 4).map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-xs text-gray-600">
                            {vehicle.licensePlate}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {fuelEfficiency} MPG
                          </p>
                          <p className="text-xs text-gray-600">
                            {vehicle.fuelLevel}% fuel
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Fuel Stations */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Fuel Stations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(new Set(MOCK_FUEL_RECORDS.map((r) => r.location)))
                    .slice(0, 6)
                    .map((location, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                      >
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {location}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ),
        }}
      />
    </>
  );
}
