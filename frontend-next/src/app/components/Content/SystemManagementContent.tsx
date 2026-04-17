// SystemManagementContent - Manages Systems (children of Products, parents of Topics)
import React, { useMemo, useState } from "react";
import useSystems from "../../../hooks/useSystems";
import useSystemStats from "../../../hooks/useSystemStats";
import { System, SystemQueryParams } from "../../types/content";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { systemTableConfig } from "../../config/tables/system-table.config";
import SystemFormModal from "./SystemFormModal";
import SystemViewModal from "./SystemViewModal";
import { SystemsService } from "../../services/systems/systems.service";
import { useContentManagementDestructiveActions } from "../../../hooks/useContentManagementDestructiveActions";

export default function SystemManagementContent() {
  const systemsService = useMemo(() => new SystemsService(), []);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);

  const { systems, loading, error, pagination, refetch, updateFilters, filters } = useSystems({ page: 1, limit: 10 });

  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useSystemStats();

  const handleFiltersChange = (newFilters: Partial<any>) => updateFilters(newFilters);
  const handleClearFilters = () => updateFilters({ search: undefined, status: undefined, productId: undefined, dateFrom: undefined, dateTo: undefined });
  const handlePageChange = (page: number) => updateFilters({ page });
  const handlePageSizeChange = (pageSize: number) => updateFilters({ limit: pageSize, page: 1 });
  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => updateFilters({ sortBy: sortBy as SystemQueryParams["sortBy"], sortOrder });
  const handleRefresh = () => {
    refetch();
    void refetchStats();
  };
  const handleView = (item: System) => { setSelectedSystem(item); setViewModalOpen(true); };
  const handleEdit = (item: System) => { setSelectedSystem(item); setFormMode("edit"); setFormModalOpen(true); };
  const handleCloseFormModal = () => { setFormModalOpen(false); setSelectedSystem(null); };
  const handleCloseViewModal = () => { setViewModalOpen(false); setSelectedSystem(null); };
  const handleItemSaved = () => {
    refetch();
    void refetchStats();
    handleCloseFormModal();
  };

  const getFormModalProps = (item: System | null, mode: "create" | "edit") => ({ system: item, mode, onSystemSaved: handleItemSaved });
  const getViewModalProps = (item: System | null) => ({ system: item });

  const configWithHandlers = { ...systemTableConfig, onAdd: () => { setFormMode("create"); setSelectedSystem(null); setFormModalOpen(true); } };

  const destructive = useContentManagementDestructiveActions<System>({
    entitySingular: "system",
    entityPlural: "systems",
    deletePermanent: (id) => systemsService.deletePermanent(id),
    refetch,
    refetchStats,
  });

  return (
    <DataManagementContent config={configWithHandlers} data={systems} loading={loading} error={error} pagination={pagination} filters={filters}
      stats={stats}
      statsLoading={statsLoading}
      onFiltersChange={handleFiltersChange} onClearFilters={handleClearFilters} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange}
      onSortChange={handleSortChange} onRefresh={handleRefresh} onView={handleView} onEdit={handleEdit}
      onDeletePermanent={destructive.onDeletePermanent} onBulkDeletePermanent={destructive.onBulkDeletePermanent}
      FormModal={SystemFormModal} ViewModal={SystemViewModal} formModalOpen={formModalOpen} viewModalOpen={viewModalOpen}
      selectedItem={selectedSystem} formMode={formMode} onCloseFormModal={handleCloseFormModal} onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleItemSaved} getFormModalProps={getFormModalProps} getViewModalProps={getViewModalProps} />
  );
}
