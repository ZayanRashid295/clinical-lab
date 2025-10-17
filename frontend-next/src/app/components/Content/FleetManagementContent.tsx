import React from "react";
import { useRouter } from "next/router";
import {
  Car,
  Users,
  Wrench,
  Fuel,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  MOCK_VEHICLES,
  MOCK_DRIVERS,
  MOCK_MAINTENANCE_RECORDS,
  MOCK_FUEL_RECORDS,
  MOCK_ROUTES,
} from "../../../data/mockData";

export default function FleetManagementContent() {
  const router = useRouter();

  // Calculate fleet statistics
  const totalVehicles = MOCK_VEHICLES.length;
  const activeVehicles = MOCK_VEHICLES.filter(
    (v) => v.status === "ACTIVE"
  ).length;
  const maintenanceVehicles = MOCK_VEHICLES.filter(
    (v) => v.status === "MAINTENANCE"
  ).length;
  const totalDrivers = MOCK_DRIVERS.length;
  const activeDrivers = MOCK_DRIVERS.filter(
    (d) => d.status === "ACTIVE"
  ).length;
  const totalMaintenanceCost = MOCK_MAINTENANCE_RECORDS.reduce(
    (sum, record) => sum + record.cost,
    0
  );
  const totalFuelCost = MOCK_FUEL_RECORDS.reduce(
    (sum, record) => sum + record.cost,
    0
  );
  const totalRevenue = MOCK_ROUTES.reduce(
    (sum, route) => sum + route.revenue,
    0
  );

  const stats = [
    {
      id: "total-vehicles",
      label: "Total Vehicles",
      value: totalVehicles,
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "active-vehicles",
      label: "Active Vehicles",
      value: activeVehicles,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "maintenance-vehicles",
      label: "In Maintenance",
      value: maintenanceVehicles,
      icon: Wrench,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      id: "total-drivers",
      label: "Total Drivers",
      value: totalDrivers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "active-drivers",
      label: "Active Drivers",
      value: activeDrivers,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "total-revenue",
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const quickActions = [
    {
      id: "vehicles",
      label: "Manage Vehicles",
      description: "View and manage fleet vehicles",
      icon: Car,
      path: "/fleet/vehicles",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: "drivers",
      label: "Manage Drivers",
      description: "View and manage driver information",
      icon: Users,
      path: "/fleet/drivers",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      id: "maintenance",
      label: "Maintenance",
      description: "Schedule and track maintenance",
      icon: Wrench,
      path: "/fleet/maintenance",
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      id: "fuel",
      label: "Fuel Tracking",
      description: "Monitor fuel consumption and costs",
      icon: Fuel,
      path: "/fleet/fuel",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      id: "routes",
      label: "Routes",
      description: "Manage and optimize routes",
      icon: MapPin,
      path: "/fleet/routes",
      color: "bg-green-500 hover:bg-green-600",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <p className="mt-2 text-gray-600">
          Monitor and manage your fleet operations
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.id}
              className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <IconComponent className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => router.push(action.path)}
                className={`${action.color} text-white rounded-lg p-6 text-left transition-colors`}
              >
                <div className="flex items-center mb-2">
                  <IconComponent className="h-6 w-6 mr-3" />
                  <h3 className="text-lg font-semibold">{action.label}</h3>
                </div>
                <p className="text-sm opacity-90">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Maintenance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Maintenance
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {MOCK_MAINTENANCE_RECORDS.slice(0, 3).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Wrench className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {record.vehicleInfo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${record.cost}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push("/fleet/maintenance")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all maintenance →
              </button>
            </div>
          </div>
        </div>

        {/* Recent Fuel Records */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Fuel Records
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {MOCK_FUEL_RECORDS.slice(0, 3).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Fuel className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {record.vehicleInfo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.fuelAmount} gallons @ ${record.pricePerGallon}
                        /gal
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${record.cost}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push("/fleet/fuel")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all fuel records →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Fleet Alerts
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Maintenance Due Soon
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {
                  MOCK_VEHICLES.filter(
                    (v) =>
                      new Date(v.nextMaintenance) <=
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  ).length
                }{" "}
                vehicles have maintenance due within the next 7 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

