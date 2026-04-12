import React, { useMemo, useState } from "react";
import useQuestions from "../../../hooks/useQuestions";
import useQuestionStats from "../../../hooks/useQuestionStats";
import { Question, QuestionQueryParams } from "../../types/question";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { questionTableConfig } from "../../config/tables/question-table.config";
import QuestionFormModal from "./QuestionFormModal";
import QuestionViewModal from "./QuestionViewModal";
import { QuestionsService } from "../../services/questions/questions.service";
import { useContentManagementDestructiveActions } from "../../../hooks/useContentManagementDestructiveActions";

export default function QuestionManagementContent() {
  const questionsService = useMemo(() => new QuestionsService(), []);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const {
    questions,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useQuestions({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
  } = useQuestionStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      difficulty: undefined,
      topicId: undefined,
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
      sortBy: sortBy as QuestionQueryParams["sortBy"],
      sortOrder,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setViewModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedQuestion(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedQuestion(null);
  };

  const handleQuestionSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const getFormModalProps = (
    question: Question | null,
    mode: "create" | "edit"
  ) => {
    return {
      question: question,
      mode: mode,
      onQuestionSaved: handleQuestionSaved,
    };
  };

  const getViewModalProps = (question: Question | null) => {
    return {
      question: question,
    };
  };

  const configWithHandlers = {
    ...questionTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedQuestion(null);
      setFormModalOpen(true);
    },
  };

  const destructive = useContentManagementDestructiveActions<Question>({
    entitySingular: "question",
    entityPlural: "questions",
    deletePermanent: (id) => questionsService.deletePermanent(id),
    refetch,
  });

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={questions}
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
      onView={handleViewQuestion}
      onEdit={handleEditQuestion}
      onDeletePermanent={destructive.onDeletePermanent}
      onBulkDeletePermanent={destructive.onBulkDeletePermanent}
      FormModal={QuestionFormModal}
      ViewModal={QuestionViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedQuestion}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleQuestionSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

