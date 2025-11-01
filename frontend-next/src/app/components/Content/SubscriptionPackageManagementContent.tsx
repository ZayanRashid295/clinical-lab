import React, { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import useSubscriptionPackages from "../../../hooks/useSubscriptionPackages";
import useSubscriptionPackageStats from "../../../hooks/useSubscriptionPackageStats";
import { SubscriptionPackage } from "../../types/subscription";
import SubscriptionPackageFormModal from "../Subscriptions/SubscriptionPackageFormModal";
import SubscriptionPackageViewModal from "../Subscriptions/SubscriptionPackageViewModal";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { subscriptionPackageTableConfig } from "../../config/tables/subscription-package-table.config";

export default function SubscriptionPackageManagementContent() {
  const { config } = useTheme();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedPackage, setSelectedPackage] =
    useState<SubscriptionPackage | null>(null);

  // Use the custom hooks for data fetching
  const {
    packages,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useSubscriptionPackages({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useSubscriptionPackageStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      productSubtypeId: undefined,
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

  const handleViewPackage = (pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
    setViewModalOpen(true);
  };

  const handleEditPackage = (pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleAddPackage = () => {
    setSelectedPackage(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handlePackageSaved = (savedPackage: SubscriptionPackage) => {
    // Refresh the packages list to show updated data
    refetch();
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedPackage(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedPackage(null);
  };

  // Configure modal props mapping
  const getFormModalProps = (
    pkg: SubscriptionPackage | null,
    mode: "create" | "edit"
  ) => {
    return {
      package: pkg,
      onPackageSaved: handlePackageSaved,
    };
  };

  const getViewModalProps = (pkg: SubscriptionPackage | null) => {
    return {
      package: pkg,
    };
  };

  // Create config with onAdd handler
  const configWithHandlers = {
    ...subscriptionPackageTableConfig,
    onAdd: handleAddPackage,
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={packages}
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
      onView={handleViewPackage}
      onEdit={handleEditPackage}
      FormModal={SubscriptionPackageFormModal}
      ViewModal={SubscriptionPackageViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedPackage}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handlePackageSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

