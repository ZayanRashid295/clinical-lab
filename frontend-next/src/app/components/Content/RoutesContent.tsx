import React, { useState, useEffect } from "react";
import {
  MapPin,
  Route,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Navigation,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { MOCK_ROUTES } from "../../../data/mockData";

export default function RoutesContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filteredRoutes, setFilteredRoutes] = useState(MOCK_ROUTES);

  useEffect(() => {
    // Filter routes based on search term and status
    let filtered = MOCK_ROUTES;

    if (searchTerm) {
      filtered = filtered.filter(
        (route) =>
          route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.startLocation
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          route.endLocation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((route) => route.status === statusFilter);
    }

    setFilteredRoutes(filtered);
  }, [searchTerm, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "PLANNED":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "INACTIVE":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PLANNED":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalRoutes = MOCK_ROUTES.length;
  const activeRoutes = MOCK_ROUTES.filter((r) => r.status === "ACTIVE").length;
  const plannedRoutes = MOCK_ROUTES.filter(
    (r) => r.status === "PLANNED"
  ).length;
  const totalRevenue = MOCK_ROUTES.reduce(
    (sum, route) => sum + route.revenue,
    0
  );
  const totalPassengers = MOCK_ROUTES.reduce(
    (sum, route) => sum + route.passengerCount,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fleet Routes</h1>
            <p className="mt-2 text-gray-600">
              Manage and optimize your fleet routes
            </p>
          </div>
          <button
            onClick={() => {
              /* Create route functionality */
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Route
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Route className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{totalRoutes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-gray-900">{activeRoutes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Total Passengers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalPassengers}
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
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PLANNED">Planned</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.map((route) => (
          <div
            key={route.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Route Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Route className="h-6 w-6" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold">{route.name}</h3>
                    <p className="text-sm opacity-90">{route.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(route.status)}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      route.status
                    )}`}
                  >
                    {route.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Route Info */}
            <div className="p-6">
              {/* Route Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="font-medium">From:</span>
                  <span className="ml-2">{route.startLocation}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Navigation className="h-4 w-4 mr-2" />
                  <span className="font-medium">To:</span>
                  <span className="ml-2">{route.endLocation}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="font-medium">Duration:</span>
                  <span className="ml-2">{route.estimatedTime} min</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Route className="h-4 w-4 mr-2" />
                  <span className="font-medium">Distance:</span>
                  <span className="ml-2">{route.distance} mi</span>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vehicles</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {route.vehicleCount}
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Passengers</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {route.passengerCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(route.revenue)}
                  </span>
                </div>
              </div>

              {/* Frequency */}
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <Clock className="h-4 w-4 mr-2" />
                <span>Frequency: {route.frequency}</span>
              </div>

              {/* Created Date */}
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Created: {formatDate(route.createdAt)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    /* View route details */
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => {
                    /* Edit route */
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    /* Delete route */
                  }}
                  className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRoutes.length === 0 && (
        <div className="text-center py-12">
          <Route className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No routes found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "ALL"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first route."}
          </p>
        </div>
      )}
    </div>
  );
}
