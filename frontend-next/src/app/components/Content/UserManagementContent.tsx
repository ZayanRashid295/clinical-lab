import React, { useState, useEffect } from "react";
import { useTheme } from "../../../hooks/useTheme";
import useUsers from "../../../hooks/useUsers";
import useUserStats from "../../../hooks/useUserStats";
import { User } from "../../types/user";
import UserFormModal from "../Users/UserFormModal";
import UserViewModal from "../Users/UserViewModal";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { userTableConfig } from "../../config/tables/user-table.config";

export default function UserManagementContent() {
  const { config } = useTheme();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Use the custom hooks for data fetching
  const { users, loading, error, pagination, refetch, updateFilters, filters } =
    useUsers({
      page: 1,
      limit: 10,
    });

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

  // Configure modal props mapping
  const getFormModalProps = (user: User | null, mode: "create" | "edit") => {
    return {
      user: user,
      onUserSaved: handleUserSaved,
    };
  };

  const getViewModalProps = (user: User | null) => {
    return {
      user: user,
    };
  };

  // Create config with onAdd handler
  const configWithHandlers = {
    ...userTableConfig,
    onAdd: handleAddUser,
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={users}
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
      onView={handleViewUser}
      onEdit={handleEditUser}
      FormModal={UserFormModal}
      ViewModal={UserViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedUser}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleUserSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}
