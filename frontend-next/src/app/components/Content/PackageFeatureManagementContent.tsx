import React, { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import usePackageFeatures from "../../../hooks/usePackageFeatures";
import usePackageFeatureStats from "../../../hooks/usePackageFeatureStats";
import { PackageFeature } from "../../types/subscription";
import PackageFeatureFormModal from "../Subscriptions/PackageFeatureFormModal";
import PackageFeatureViewModal from "../Subscriptions/PackageFeatureViewModal";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { packageFeatureTableConfig } from "../../config/tables/package-feature-table.config";

export default function PackageFeatureManagementContent() {
  const { config } = useTheme();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedFeature, setSelectedFeature] =
    useState<PackageFeature | null>(null);

  // Use the custom hooks for data fetching
  const {
    features,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = usePackageFeatures({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = usePackageFeatureStats();

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

  const handleViewFeature = (feature: PackageFeature) => {
    setSelectedFeature(feature);
    setViewModalOpen(true);
  };

  const handleEditFeature = (feature: PackageFeature) => {
    setSelectedFeature(feature);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleAddFeature = () => {
    setSelectedFeature(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleFeatureSaved = (savedFeature: PackageFeature) => {
    // Refresh the features list to show updated data
    refetch();
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedFeature(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedFeature(null);
  };

  // Configure modal props mapping
  const getFormModalProps = (
    feature: PackageFeature | null,
    mode: "create" | "edit"
  ) => {
    return {
      feature: feature,
      onFeatureSaved: handleFeatureSaved,
    };
  };

  const getViewModalProps = (feature: PackageFeature | null) => {
    return {
      feature: feature,
    };
  };

  // Create config with onAdd handler
  const configWithHandlers = {
    ...packageFeatureTableConfig,
    onAdd: handleAddFeature,
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={features}
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
      onView={handleViewFeature}
      onEdit={handleEditFeature}
      FormModal={PackageFeatureFormModal}
      ViewModal={PackageFeatureViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedFeature}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleFeatureSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

