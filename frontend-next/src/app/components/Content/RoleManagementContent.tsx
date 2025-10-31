import React, { useState, useEffect, useRef } from "react";
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
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  Table,
} from "lucide-react";
import { useTheme } from "../../../hooks/useTheme";
import useRoles from "../../../hooks/useRoles";
import useRoleStats from "../../../hooks/useRoleStats";
import { Role } from "../../types/user";
import RoleFormModal from "../Roles/RoleFormModal";
import RoleViewModal from "../Roles/RoleViewModal";
import RoleFilters from "../Roles/RoleFilters";
import RolesTable from "../Roles/RolesTable";
import Pagination from "../Users/Pagination";

export default function RoleManagementContent() {
  const { config } = useTheme();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [showFilters, setShowFilters] = useState(true);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  // Use the custom hooks for data fetching
  const { roles, loading, error, pagination, refetch, updateFilters, filters } =
    useRoles({
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
  }, [loading, roles.length]);

  const { stats, loading: statsLoading, error: statsError } = useRoleStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setViewModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleRoleSaved = (savedRole: Role) => {
    // Refresh the roles list to show updated data
    refetch();
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedRole(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedRole(null);
  };

  const handleDeactivateRole = (role: Role) => {
    console.log("Deactivate role:", role);
    // TODO: Implement role deactivation
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-3">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="mt-2 text-gray-600">
            Define and manage user roles and permissions
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield
                className="h-8 w-8"
                style={{ color: "var(--color-primary-600)" }}
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Roles</p>
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
              <p className="text-sm font-medium text-gray-600">Active Roles</p>
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
                Inactive Roles
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
              <Users
                className="h-8 w-8"
                style={{ color: "var(--color-primary-400)" }}
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : "..."}
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
            placeholder="Search roles..."
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
            onClick={handleAddRole}
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
            <Plus className="h-5 w-5 mr-2" />
            Add Role
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6">
          <RoleFilters
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
                Error loading roles
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
                    <p className="mt-2 text-gray-600">Loading roles...</p>
                  </div>
                </div>
              )}
              <RolesTable
                key="roles-table"
                roles={roles}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onSortChange={handleSortChange}
                onViewRole={handleViewRole}
                onEditRole={handleEditRole}
                title="Role Management"
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
                    <p className="mt-2 text-gray-600">Loading roles...</p>
                  </div>
                </div>
              )}
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Role Header */}
                  <div
                    className="p-6 text-white"
                    style={{
                      background: `linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))`,
                    }}
                  >
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
                    <p className="text-sm text-gray-600 mb-4">
                      {role.description}
                    </p>

                    {/* Permissions */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Permissions ({role.permissions.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
                          >
                            <Key className="h-3 w-3 mr-1" />
                            {permission.split("_")[0]}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                            +{role.permissions.length - 3} more
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
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewRole(role)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditRole(role)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeactivateRole(role)}
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
      <RoleFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        role={selectedRole}
        onRoleSaved={handleRoleSaved}
        mode={formMode}
      />

      {/* View Modal */}
      <RoleViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        role={selectedRole}
      />
    </div>
  );
}
