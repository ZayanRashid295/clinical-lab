import React, { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Users,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Key,
  Lock,
  Unlock,
} from "lucide-react";

// Mock data for roles
const MOCK_ROLES = [
  {
    id: "1",
    name: "ADMIN",
    displayName: "Administrator",
    description: "Full system access with all permissions",
    permissions: [
      "USER_MANAGEMENT",
      "ROLE_MANAGEMENT",
      "SYSTEM_SETTINGS",
      "FLEET_MANAGEMENT",
      "RIDE_MANAGEMENT",
      "PAYMENT_MANAGEMENT",
      "REPORT_ACCESS",
      "AUDIT_ACCESS",
    ],
    userCount: 3,
    isActive: true,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-12-15T10:30:00Z",
  },
  {
    id: "2",
    name: "FLEET_MANAGER",
    displayName: "Fleet Manager",
    description: "Manage fleet operations, vehicles, and drivers",
    permissions: [
      "FLEET_MANAGEMENT",
      "DRIVER_MANAGEMENT",
      "VEHICLE_MANAGEMENT",
      "RIDE_MANAGEMENT",
      "REPORT_ACCESS",
    ],
    userCount: 8,
    isActive: true,
    createdAt: "2023-02-15T09:00:00Z",
    updatedAt: "2023-11-20T14:45:00Z",
  },
  {
    id: "3",
    name: "DRIVER",
    displayName: "Driver",
    description: "Access to driver-specific features and ride management",
    permissions: ["RIDE_MANAGEMENT", "PROFILE_MANAGEMENT", "EARNING_ACCESS"],
    userCount: 156,
    isActive: true,
    createdAt: "2023-03-01T12:00:00Z",
    updatedAt: "2023-10-30T16:20:00Z",
  },
  {
    id: "4",
    name: "CUSTOMER_SUPPORT",
    displayName: "Customer Support",
    description: "Handle customer inquiries and support tickets",
    permissions: [
      "CUSTOMER_SUPPORT",
      "RIDE_VIEW",
      "PAYMENT_VIEW",
      "PROFILE_MANAGEMENT",
    ],
    userCount: 12,
    isActive: true,
    createdAt: "2023-04-10T11:30:00Z",
    updatedAt: "2023-12-01T09:15:00Z",
  },
  {
    id: "5",
    name: "FINANCE_MANAGER",
    displayName: "Finance Manager",
    description: "Access to financial reports and payment management",
    permissions: ["PAYMENT_MANAGEMENT", "REPORT_ACCESS", "FINANCIAL_ANALYTICS"],
    userCount: 5,
    isActive: false,
    createdAt: "2023-05-20T14:00:00Z",
    updatedAt: "2023-11-15T13:30:00Z",
  },
];

const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: "User Management",
  ROLE_MANAGEMENT: "Role Management",
  SYSTEM_SETTINGS: "System Settings",
  FLEET_MANAGEMENT: "Fleet Management",
  DRIVER_MANAGEMENT: "Driver Management",
  VEHICLE_MANAGEMENT: "Vehicle Management",
  RIDE_MANAGEMENT: "Ride Management",
  PAYMENT_MANAGEMENT: "Payment Management",
  CUSTOMER_SUPPORT: "Customer Support",
  REPORT_ACCESS: "Report Access",
  AUDIT_ACCESS: "Audit Access",
  PROFILE_MANAGEMENT: "Profile Management",
  EARNING_ACCESS: "Earning Access",
  RIDE_VIEW: "Ride View",
  PAYMENT_VIEW: "Payment View",
  FINANCIAL_ANALYTICS: "Financial Analytics",
};

export default function RoleManagementContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filteredRoles, setFilteredRoles] = useState(MOCK_ROLES);

  useEffect(() => {
    // Filter roles based on search term and status
    let filtered = MOCK_ROLES;

    if (searchTerm) {
      filtered = filtered.filter(
        (role) =>
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      const isActive = statusFilter === "ACTIVE";
      filtered = filtered.filter((role) => role.isActive === isActive);
    }

    setFilteredRoles(filtered);
  }, [searchTerm, statusFilter]);

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalRoles = MOCK_ROLES.length;
  const activeRoles = MOCK_ROLES.filter((r) => r.isActive).length;
  const inactiveRoles = MOCK_ROLES.filter((r) => !r.isActive).length;
  const totalUsers = MOCK_ROLES.reduce((sum, role) => sum + role.userCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Role Management
            </h1>
            <p className="mt-2 text-gray-600">
              Define and manage user roles and permissions
            </p>
          </div>
          <button
            onClick={() => {
              /* Create role functionality */
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Role
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{totalRoles}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Roles</p>
              <p className="text-2xl font-bold text-gray-900">{activeRoles}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Inactive Roles
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {inactiveRoles}
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
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
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
                placeholder="Search roles..."
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
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Role Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold">
                      {role.displayName}
                    </h3>
                    <p className="text-sm opacity-90">{role.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(role.isActive)}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      role.isActive
                    )}`}
                  >
                    {role.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Info */}
            <div className="p-6">
              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{role.description}</p>

              {/* User Count */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Users with this role</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {role.userCount}
                </span>
              </div>

              {/* Permissions */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Permissions ({role.permissions.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 6).map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
                    >
                      <Key className="h-3 w-3 mr-1" />
                      {PERMISSION_CATEGORIES[
                        permission as keyof typeof PERMISSION_CATEGORIES
                      ] || permission}
                    </span>
                  ))}
                  {role.permissions.length > 6 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                      +{role.permissions.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Created: {formatDate(role.createdAt)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Updated: {formatDate(role.updatedAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    /* View role details */
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => {
                    /* Edit role */
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    /* Toggle role status */
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    role.isActive
                      ? "text-red-700 bg-red-50 border border-red-300 hover:bg-red-100"
                      : "text-green-700 bg-green-50 border border-green-300 hover:bg-green-100"
                  }`}
                >
                  {role.isActive ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No roles found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "ALL"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first role."}
          </p>
        </div>
      )}
    </div>
  );
}
