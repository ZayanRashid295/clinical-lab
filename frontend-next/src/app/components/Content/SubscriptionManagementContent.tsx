import React, { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import useSubscriptions from "../../../hooks/useSubscriptions";
import useSubscriptionStats from "../../../hooks/useSubscriptionStats";
import { Subscription } from "../../types/subscription";
import SubscriptionFormModal from "../Subscriptions/SubscriptionFormModal";
import SubscriptionViewModal from "../Subscriptions/SubscriptionViewModal";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { subscriptionTableConfig } from "../../config/tables/subscription-table.config";

export default function SubscriptionManagementContent() {
  const { config } = useTheme();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  // Use the custom hooks for data fetching
  const {
    subscriptions,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useSubscriptions({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useSubscriptionStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      userId: undefined,
      subscriptionPackageId: undefined,
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

  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setViewModalOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleAddSubscription = () => {
    setSelectedSubscription(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleSubscriptionSaved = (savedSubscription: Subscription) => {
    // Refresh the subscriptions list to show updated data
    refetch();
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedSubscription(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedSubscription(null);
  };

  // Configure modal props mapping
  const getFormModalProps = (
    subscription: Subscription | null,
    mode: "create" | "edit"
  ) => {
    return {
      subscription: subscription,
      onSubscriptionSaved: handleSubscriptionSaved,
    };
  };

  const getViewModalProps = (subscription: Subscription | null) => {
    return {
      subscription: subscription,
    };
  };

  // Create config with onAdd handler
  const configWithHandlers = {
    ...subscriptionTableConfig,
    onAdd: handleAddSubscription,
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={subscriptions}
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
      onView={handleViewSubscription}
      onEdit={handleEditSubscription}
      FormModal={SubscriptionFormModal}
      ViewModal={SubscriptionViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedSubscription}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleSubscriptionSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

