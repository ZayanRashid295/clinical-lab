import React, { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import useEntitlementDefinitions from "../../../hooks/useEntitlementDefinitions";
import useEntitlementDefinitionStats from "../../../hooks/useEntitlementDefinitionStats";
import { EntitlementDefinition } from "../../types/subscription";
import EntitlementDefinitionFormModal from "../Subscriptions/EntitlementDefinitionFormModal";
import EntitlementDefinitionViewModal from "../Subscriptions/EntitlementDefinitionViewModal";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { entitlementDefinitionTableConfig } from "../../config/tables/entitlement-definition-table.config";

export default function EntitlementDefinitionManagementContent() {
  const { config } = useTheme();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<EntitlementDefinition | null>(null);

  const {
    definitions,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useEntitlementDefinitions({ page: 1, limit: 10 });

  const { stats, loading: statsLoading } = useEntitlementDefinitionStats();

  const handleAdd = () => {
    setSelected(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleView = (row: EntitlementDefinition) => {
    setSelected(row);
    setViewModalOpen(true);
  };

  const handleEdit = (row: EntitlementDefinition) => {
    setSelected(row);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleSaved = () => {
    refetch();
  };

  const configWithHandlers = {
    ...entitlementDefinitionTableConfig,
    onAdd: handleAdd,
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={definitions}
      loading={loading}
      error={error}
      pagination={pagination}
      filters={filters}
      stats={stats}
      statsLoading={statsLoading}
      onFiltersChange={(nf) => updateFilters(nf)}
      onClearFilters={() =>
        updateFilters({
          search: undefined,
          status: undefined,
          productSubtypeId: undefined,
          dateFrom: undefined,
          dateTo: undefined,
        } as any)
      }
      onPageChange={(page) => updateFilters({ page } as any)}
      onPageSizeChange={(limit) => updateFilters({ limit, page: 1 } as any)}
      onSortChange={(sortBy, sortOrder) => updateFilters({ sortBy, sortOrder } as any)}
      onRefresh={refetch}
      onView={handleView}
      onEdit={handleEdit}
      FormModal={EntitlementDefinitionFormModal}
      ViewModal={EntitlementDefinitionViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selected}
      formMode={formMode}
      onCloseFormModal={() => setFormModalOpen(false)}
      onCloseViewModal={() => setViewModalOpen(false)}
      onItemSaved={handleSaved}
      getFormModalProps={(d, mode) => ({
        definition: d,
        onDefinitionSaved: handleSaved,
      })}
      getViewModalProps={(d) => ({ definition: d })}
    />
  );
}

