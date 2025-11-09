import React, { useState } from "react";
import useQuestionPaperQuestions from "../../../hooks/useQuestionPaperQuestions";
import useQuestionPaperQuestionStats from "../../../hooks/useQuestionPaperQuestionStats";
import {
  QuestionPaperQuestion,
  QuestionPaperQuestionQueryParams,
} from "../../types/question-paper-question";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { questionPaperQuestionTableConfig } from "../../config/tables/question-paper-question-table.config";
import QuestionPaperQuestionFormModal from "./QuestionPaperQuestionFormModal";
import QuestionPaperQuestionViewModal from "./QuestionPaperQuestionViewModal";

export default function QuestionPaperQuestionManagementContent() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedQuestionPaperQuestion, setSelectedQuestionPaperQuestion] =
    useState<QuestionPaperQuestion | null>(null);

  const {
    questionPaperQuestions,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useQuestionPaperQuestions({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
  } = useQuestionPaperQuestionStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      questionPaperId: undefined,
      questionId: undefined,
      hasAnswer: undefined,
      isCorrect: undefined,
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
      sortBy: sortBy as QuestionPaperQuestionQueryParams["sortBy"],
      sortOrder,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewQuestionPaperQuestion = (
    questionPaperQuestion: QuestionPaperQuestion
  ) => {
    setSelectedQuestionPaperQuestion(questionPaperQuestion);
    setViewModalOpen(true);
  };

  const handleEditQuestionPaperQuestion = (
    questionPaperQuestion: QuestionPaperQuestion
  ) => {
    setSelectedQuestionPaperQuestion(questionPaperQuestion);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedQuestionPaperQuestion(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedQuestionPaperQuestion(null);
  };

  const handleQuestionPaperQuestionSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const getFormModalProps = (
    questionPaperQuestion: QuestionPaperQuestion | null,
    mode: "create" | "edit"
  ) => {
    return {
      questionPaperQuestion: questionPaperQuestion,
      mode: mode,
      onQuestionPaperQuestionSaved: handleQuestionPaperQuestionSaved,
    };
  };

  const getViewModalProps = (
    questionPaperQuestion: QuestionPaperQuestion | null
  ) => {
    return {
      questionPaperQuestion: questionPaperQuestion,
    };
  };

  const configWithHandlers = {
    ...questionPaperQuestionTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedQuestionPaperQuestion(null);
      setFormModalOpen(true);
    },
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={questionPaperQuestions}
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
      onView={handleViewQuestionPaperQuestion}
      onEdit={handleEditQuestionPaperQuestion}
      FormModal={QuestionPaperQuestionFormModal}
      ViewModal={QuestionPaperQuestionViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedQuestionPaperQuestion}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleQuestionPaperQuestionSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

