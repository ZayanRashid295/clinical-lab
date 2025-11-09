import React, { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import useRoles from "../../../hooks/useRoles";
import useRoleStats from "../../../hooks/useRoleStats";
import { Role } from "../../types/user";
import RoleFormModal from "../Roles/RoleFormModal";
import RoleViewModal from "../Roles/RoleViewModal";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { roleTableConfig } from "../../config/tables/role-table.config";

export default function RoleManagementContent() {
  const { config } = useTheme();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Use the custom hooks for data fetching
  const { roles, loading, error, pagination, refetch, updateFilters, filters } =
    useRoles({
      page: 1,
      limit: 10,
    });

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

  // Configure modal props mapping
  const getFormModalProps = (role: Role | null, mode: "create" | "edit") => {
    return {
      role: role,
      onRoleSaved: handleRoleSaved,
    };
  };

  const getViewModalProps = (role: Role | null) => {
    return {
      role: role,
    };
  };

  // Create config with onAdd handler
  const configWithHandlers = {
    ...roleTableConfig,
    onAdd: handleAddRole,
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={roles}
      loading={loading}
      error={error}
      pagination={pagination}
      filters={filters}
      stats={stats}
      statsLoading={statsLoading}
      onFiltersChange={handleFiltersChange}
      onClearFilters={handleClearFilters}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onSortChange={handleSortChange}
      onRefresh={handleRefresh}
      onView={handleViewRole}
      onEdit={handleEditRole}
      FormModal={RoleFormModal}
      ViewModal={RoleViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedRole}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleRoleSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}
