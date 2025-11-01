import React, { useState } from "react";
import useQuestionPapers from "../../../hooks/useQuestionPapers";
import useQuestionPaperStats from "../../../hooks/useQuestionPaperStats";
import { QuestionPaper } from "../../types/assessment";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { questionPaperTableConfig } from "../../config/tables/question-paper-table.config";
import QuestionPaperFormModal from "./QuestionPaperFormModal";
import QuestionPaperViewModal from "./QuestionPaperViewModal";

export default function QuestionPaperManagementContent() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedQuestionPaper, setSelectedQuestionPaper] =
    useState<QuestionPaper | null>(null);

  const {
    questionPapers,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useQuestionPapers({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
  } = useQuestionPaperStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      type: undefined,
      userId: undefined,
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

  const handleViewQuestionPaper = (questionPaper: QuestionPaper) => {
    setSelectedQuestionPaper(questionPaper);
    setViewModalOpen(true);
  };

  const handleEditQuestionPaper = (questionPaper: QuestionPaper) => {
    setSelectedQuestionPaper(questionPaper);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedQuestionPaper(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedQuestionPaper(null);
  };

  const handleQuestionPaperSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const getFormModalProps = (
    questionPaper: QuestionPaper | null,
    mode: "create" | "edit"
  ) => {
    return {
      questionPaper: questionPaper,
      mode: mode,
      onQuestionPaperSaved: handleQuestionPaperSaved,
    };
  };

  const getViewModalProps = (questionPaper: QuestionPaper | null) => {
    return {
      questionPaper: questionPaper,
    };
  };

  const configWithHandlers = {
    ...questionPaperTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedQuestionPaper(null);
      setFormModalOpen(true);
    },
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={questionPapers}
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
      onView={handleViewQuestionPaper}
      onEdit={handleEditQuestionPaper}
      FormModal={QuestionPaperFormModal}
      ViewModal={QuestionPaperViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedQuestionPaper}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleQuestionPaperSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

