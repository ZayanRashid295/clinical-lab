import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  LayoutGrid,
  Table,
} from "lucide-react";
import { useTheme } from "../../../hooks/useTheme";
import useUsers from "../../../hooks/useUsers";
import useUserStats from "../../../hooks/useUserStats";
import { User } from "../../types/user";
import UserFormModal from "../Users/UserFormModal";
import UserViewModal from "../Users/UserViewModal";
import UserFilters from "../Users/UserFilters";
import UsersTable from "../Users/UsersTable";
import Pagination from "../Users/Pagination";

export default function UserManagementContent() {
  const { config } = useTheme();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [showFilters, setShowFilters] = useState(true);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  // Use the custom hooks for data fetching
  const { users, loading, error, pagination, refetch, updateFilters, filters } =
    useUsers({
      page: 1,
      limit: 10,
    });

  // Track content height to prevent layout shift
  useEffect(() => {
    if (!loading && contentRef.current) {
      const height = contentRef.current.offsetHeight;
      if (height > 0) {
        setMinHeight(height);
      }
    }
  }, [loading, users.length]);

  const { stats, loading: statsLoading, error: statsError } = useUserStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      role: undefined,
      dateFrom: undefined,
      dateTo: undefined,
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "FLEET_MANAGER":
        return "bg-blue-100 text-blue-800";
      case "DRIVER":
        return "bg-green-100 text-green-800";
      case "CUSTOMER_SUPPORT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUserDisplayName = (user: User) => {
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserRole = (user: User) => {
    // Get the first role or default to 'USER'
    return user.roles?.[0]?.role?.name || "USER";
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleUserSaved = (savedUser: User) => {
    // Refresh the users list to show updated data
    refetch();
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeactivateUser = (user: User) => {
    console.log("Deactivate user:", user);
    // TODO: Implement user deactivation
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-3">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage system users and their permissions
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users
                className="h-8 w-8"
                style={{ color: "var(--color-primary-600)" }}
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : stats?.total || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle
                className="h-8 w-8"
                style={{ color: "var(--color-primary-500)" }}
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : stats?.active || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle
                className="h-8 w-8"
                style={{ color: "var(--color-primary-700)" }}
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Inactive Users
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : stats?.inactive || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock
                className="h-8 w-8"
                style={{ color: "var(--color-primary-400)" }}
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : stats?.pending || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="mb-6 flex items-center gap-4">
        {/* Search Field - Takes remaining space */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={filters.search || ""}
            onChange={(e) =>
              handleFiltersChange({ search: e.target.value || undefined })
            }
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* All Other Controls - Fixed width */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Table size={16} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "card"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showFilters
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4 mr-2 inline" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Action Buttons */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center px-4 py-2 text-white rounded-md transition-colors"
            style={{
              backgroundColor: "var(--color-primary-600)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-primary-700)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-primary-600)";
            }}
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6">
          <UserFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error loading users
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {!error && (
        <div
          ref={contentRef}
          style={{ minHeight: minHeight ? `${minHeight}px` : undefined }}
        >
          {viewMode === "table" ? (
            <div className="bg-white rounded-lg shadow border relative">
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Loading users...</p>
                  </div>
                </div>
              )}
              <UsersTable
                key="users-table"
                users={users}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onSortChange={handleSortChange}
                onViewUser={handleViewUser}
                onEditUser={handleEditUser}
                title="User Management"
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {/* Loading Overlay for Card View */}
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Loading users...</p>
                  </div>
                </div>
              )}
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* User Header */}
                  <div
                    className="p-6 text-white"
                    style={{
                      background: `linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={getUserDisplayName(user)}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-6 w-6" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold">
                            {getUserDisplayName(user)}
                          </h3>
                          <p className="text-sm opacity-90">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(user.isActive)}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            user.isActive
                          )}`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="p-6">
                    {/* Contact Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Role and Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                          getUserRole(user)
                        )}`}
                      >
                        {getUserRole(user).replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(user.isActive)}
                        <span className="text-sm text-gray-600">
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Joined: {formatDate(user.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeactivateUser(user)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination for both views */}
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      )}

      {/* Form Modal (Create/Edit) */}
      <UserFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        user={selectedUser}
        onUserSaved={handleUserSaved}
        mode={formMode}
      />

      {/* View Modal */}
      <UserViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        user={selectedUser}
      />
    </div>
  );
}
