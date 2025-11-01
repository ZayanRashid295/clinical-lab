import React, { useState } from "react";
import useSections from "../../../hooks/useSections";
import useSectionStats from "../../../hooks/useSectionStats";
import { Section } from "../../types/content";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { sectionTableConfig } from "../../config/tables/section-table.config";
import SectionFormModal from "./SectionFormModal";
import SectionViewModal from "./SectionViewModal";

export default function SectionManagementContent() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const {
    sections,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useSections({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
  } = useSectionStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      productId: undefined,
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

  const handleViewSection = (section: Section) => {
    setSelectedSection(section);
    setViewModalOpen(true);
  };

  const handleEditSection = (section: Section) => {
    setSelectedSection(section);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedSection(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedSection(null);
  };

  const handleSectionSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const getFormModalProps = (section: Section | null, mode: "create" | "edit") => {
    return {
      section: section,
      mode: mode,
      onSectionSaved: handleSectionSaved,
    };
  };

  const getViewModalProps = (section: Section | null) => {
    return {
      section: section,
    };
  };

  const configWithHandlers = {
    ...sectionTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedSection(null);
      setFormModalOpen(true);
    },
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={sections}
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
      onView={handleViewSection}
      onEdit={handleEditSection}
      FormModal={SectionFormModal}
      ViewModal={SectionViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedSection}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleSectionSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

