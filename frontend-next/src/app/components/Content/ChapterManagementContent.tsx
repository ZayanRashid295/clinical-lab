import React, { useState } from "react";
import useChapters from "../../../hooks/useChapters";
import useChapterStats from "../../../hooks/useChapterStats";
import { Chapter, ChapterQueryParams } from "../../types/content";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { chapterTableConfig } from "../../config/tables/chapter-table.config";
import ChapterFormModal from "./ChapterFormModal";
import ChapterViewModal from "./ChapterViewModal";
import { ChaptersService } from "../../services/content/chapters.service";

export default function ChapterManagementContent() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const {
    chapters,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useChapters({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
  } = useChapterStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      sectionId: undefined,
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
    updateFilters({
      sortBy: sortBy as ChapterQueryParams["sortBy"],
      sortOrder,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setViewModalOpen(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedChapter(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedChapter(null);
  };

  const handleChapterSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (!window.confirm(`Delete chapter "${chapter.name}"? This will deactivate it.`)) return;
    try {
      const service = new ChaptersService();
      await service.delete(chapter.id);
      refetch();
    } catch (err: any) {
      alert(err?.message || "Failed to delete chapter");
    }
  };

  const getFormModalProps = (chapter: Chapter | null, mode: "create" | "edit") => {
    return {
      chapter: chapter,
      mode: mode,
      onChapterSaved: handleChapterSaved,
    };
  };

  const getViewModalProps = (chapter: Chapter | null) => {
    return {
      chapter: chapter,
    };
  };

  const configWithHandlers = {
    ...chapterTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedChapter(null);
      setFormModalOpen(true);
    },
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={chapters}
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
      onView={handleViewChapter}
      onEdit={handleEditChapter}
      FormModal={ChapterFormModal}
      ViewModal={ChapterViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedChapter}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleChapterSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

