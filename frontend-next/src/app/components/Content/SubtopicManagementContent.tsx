import React, { useMemo, useState } from "react";
import useSubtopics from "../../../hooks/useSubtopics";
import useSubtopicStats from "../../../hooks/useSubtopicStats";
import { Subtopic, SubtopicQueryParams } from "../../types/content";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { subtopicTableConfig } from "../../config/tables/subtopic-table.config";
import SubtopicFormModal from "./SubtopicFormModal";
import SubtopicViewModal from "./SubtopicViewModal";
import { SubtopicsService } from "../../services/content/subtopics.service";
import { useContentManagementDestructiveActions } from "../../../hooks/useContentManagementDestructiveActions";

export default function SubtopicManagementContent() {
  const subtopicsService = useMemo(() => new SubtopicsService(), []);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);

  const { subtopics, loading, error, pagination, refetch, updateFilters, filters } = useSubtopics({ page: 1, limit: 10 });

  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useSubtopicStats();

  const handleFiltersChange = (newFilters: Partial<any>) => updateFilters(newFilters);
  const handleClearFilters = () => updateFilters({ search: undefined, status: undefined, topicId: undefined, dateFrom: undefined, dateTo: undefined });
  const handlePageChange = (page: number) => updateFilters({ page });
  const handlePageSizeChange = (pageSize: number) => updateFilters({ limit: pageSize, page: 1 });
  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => updateFilters({ sortBy: sortBy as SubtopicQueryParams["sortBy"], sortOrder });
  const handleRefresh = () => {
    refetch();
    void refetchStats();
  };
  const handleView = (item: Subtopic) => { setSelectedSubtopic(item); setViewModalOpen(true); };
  const handleEdit = (item: Subtopic) => { setSelectedSubtopic(item); setFormMode("edit"); setFormModalOpen(true); };
  const handleCloseFormModal = () => { setFormModalOpen(false); setSelectedSubtopic(null); };
  const handleCloseViewModal = () => { setViewModalOpen(false); setSelectedSubtopic(null); };
  const handleItemSaved = () => {
    refetch();
    void refetchStats();
    handleCloseFormModal();
  };

  const getFormModalProps = (item: Subtopic | null, mode: "create" | "edit") => ({ subtopic: item, mode, onSubtopicSaved: handleItemSaved });
  const getViewModalProps = (item: Subtopic | null) => ({ subtopic: item });

  const configWithHandlers = { ...subtopicTableConfig, onAdd: () => { setFormMode("create"); setSelectedSubtopic(null); setFormModalOpen(true); } };

  const destructive = useContentManagementDestructiveActions<Subtopic>({
    entitySingular: "subtopic",
    entityPlural: "subtopics",
    deletePermanent: (id) => subtopicsService.deletePermanent(id),
    refetch,
    refetchStats,
  });

  return (
    <DataManagementContent config={configWithHandlers} data={subtopics} loading={loading} error={error} pagination={pagination} filters={filters}
      stats={stats}
      statsLoading={statsLoading}
      onFiltersChange={handleFiltersChange} onClearFilters={handleClearFilters} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange}
      onSortChange={handleSortChange} onRefresh={handleRefresh} onView={handleView} onEdit={handleEdit}
      onDeletePermanent={destructive.onDeletePermanent} onBulkDeletePermanent={destructive.onBulkDeletePermanent}
      FormModal={SubtopicFormModal} ViewModal={SubtopicViewModal} formModalOpen={formModalOpen} viewModalOpen={viewModalOpen}
      selectedItem={selectedSubtopic} formMode={formMode} onCloseFormModal={handleCloseFormModal} onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleItemSaved} getFormModalProps={getFormModalProps} getViewModalProps={getViewModalProps} />
  );
}
