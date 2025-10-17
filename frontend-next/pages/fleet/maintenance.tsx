import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../../src/shared";
import { getMenuItemsForRole, MenuItem } from "../../src/app/types/menu";
import {
  MOCK_MAINTENANCE_RECORDS,
  MOCK_VEHICLES,
} from "../../src/data/mockData";
import {
  Wrench,
  Car,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Settings,
} from "lucide-react";

export default function MaintenancePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [filteredRecords, setFilteredRecords] = useState(
    MOCK_MAINTENANCE_RECORDS
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
      const foundItem = findMenuItemByPath(menuItems, "/fleet/maintenance");
      setMenuItem(foundItem);
    }
  }, [router]);

  useEffect(() => {
    // Filter maintenance records based on search term, status, and type
    let filtered = MOCK_MAINTENANCE_RECORDS;

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    if (typeFilter !== "ALL") {
      filtered = filtered.filter((record) => record.type === typeFilter);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, statusFilter, typeFilter]);

  const findMenuItemByPath = (
    items: MenuItem[],
    path: string
  ): MenuItem | null => {
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
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "SCHEDULED":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ROUTINE":
        return <Settings className="h-5 w-5 text-blue-500" />;
      case "REPAIR":
        return <Wrench className="h-5 w-5 text-red-500" />;
      case "INSPECTION":
        return <Settings className="h-5 w-5 text-green-500" />;
      case "MAJOR_REPAIR":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Wrench className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ROUTINE":
        return "bg-blue-100 text-blue-800";
      case "REPAIR":
        return "bg-red-100 text-red-800";
      case "INSPECTION":
        return "bg-green-100 text-green-800";
      case "MAJOR_REPAIR":
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

  const getUpcomingMaintenance = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return MOCK_VEHICLES.filter((vehicle) => {
      const nextMaintenance = new Date(vehicle.nextMaintenance);
      return nextMaintenance <= nextWeek && nextMaintenance >= now;
    });
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

  const upcomingMaintenance = getUpcomingMaintenance();
  const totalCost = MOCK_MAINTENANCE_RECORDS.reduce(
    (sum, record) => sum + record.cost,
    0
  );
  const completedCount = MOCK_MAINTENANCE_RECORDS.filter(
    (r) => r.status === "COMPLETED"
  ).length;
  const inProgressCount = MOCK_MAINTENANCE_RECORDS.filter(
    (r) => r.status === "IN_PROGRESS"
  ).length;

  return (
    <>
      <Head>
        <title>Fleet Maintenance - Uber Portal</title>
        <meta name="description" content="Manage fleet maintenance" />
      </Head>

      <MenuSystem
        applicationTitle="Uber Portal"
        searchPlaceholder="Search maintenance..."
        enableSearch={true}
        customContent={{
          maintenance: () => (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Fleet Maintenance
                    </h1>
                    <p className="mt-2 text-gray-600">
                      Track and manage vehicle maintenance
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      /* Schedule maintenance functionality */
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Schedule Maintenance
                  </button>
                </div>
              </div>

              {/* Alerts */}
              {upcomingMaintenance.length > 0 && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Upcoming Maintenance
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        {upcomingMaintenance.length} vehicles have maintenance
                        due within the next 7 days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search maintenance records..."
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
                      <option value="COMPLETED">Completed</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="SCHEDULED">Scheduled</option>
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ALL">All Types</option>
                      <option value="ROUTINE">Routine</option>
                      <option value="REPAIR">Repair</option>
                      <option value="INSPECTION">Inspection</option>
                      <option value="MAJOR_REPAIR">Major Repair</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Maintenance Records */}
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                          {getTypeIcon(record.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {record.vehicleInfo}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {record.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                                record.type
                              )}`}
                            >
                              {record.type.replace("_", " ")}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                record.status
                              )}`}
                            >
                              {record.status.replace("_", " ")}
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
                      <div>
                        <p className="text-sm text-gray-600">Technician</p>
                        <p className="text-sm font-medium text-gray-900">
                          {record.technician}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mileage</p>
                        <p className="text-sm font-medium text-gray-900">
                          {record.mileage.toLocaleString()} mi
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Next Due</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(record.nextDue)}
                        </p>
                      </div>
                    </div>

                    {record.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span>{" "}
                          {record.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span className="text-sm text-gray-600">
                          {record.status === "COMPLETED"
                            ? "Completed"
                            : record.status === "IN_PROGRESS"
                            ? "In Progress"
                            : "Scheduled"}
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
                  <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No maintenance records found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ||
                    statusFilter !== "ALL" ||
                    typeFilter !== "ALL"
                      ? "Try adjusting your search or filter criteria."
                      : "Get started by scheduling your first maintenance."}
                  </p>
                </div>
              )}

              {/* Summary Stats */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Wrench className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Total Records
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {MOCK_MAINTENANCE_RECORDS.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {completedCount}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        In Progress
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {inProgressCount}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Total Cost
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalCost)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        }}
      />
    </>
  );
}
