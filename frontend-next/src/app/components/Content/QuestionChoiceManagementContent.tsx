import React, { useMemo, useState } from "react";
import useQuestionChoices from "../../../hooks/useQuestionChoices";
import useQuestionChoiceStats from "../../../hooks/useQuestionChoiceStats";
import {
  QuestionChoice,
  QuestionChoiceQueryParams,
} from "../../types/question";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { questionChoiceTableConfig } from "../../config/tables/question-choice-table.config";
import QuestionChoiceFormModal from "./QuestionChoiceFormModal";
import QuestionChoiceViewModal from "./QuestionChoiceViewModal";
import { QuestionChoicesService } from "../../services/questions/question-choices.service";
import { useContentManagementDestructiveActions } from "../../../hooks/useContentManagementDestructiveActions";

export default function QuestionChoiceManagementContent() {
  const choicesService = useMemo(() => new QuestionChoicesService(), []);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedQuestionChoice, setSelectedQuestionChoice] =
    useState<QuestionChoice | null>(null);

  const {
    questionChoices,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useQuestionChoices({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
  } = useQuestionChoiceStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      questionId: undefined,
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
      sortBy: sortBy as QuestionChoiceQueryParams["sortBy"],
      sortOrder,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewQuestionChoice = (questionChoice: QuestionChoice) => {
    setSelectedQuestionChoice(questionChoice);
    setViewModalOpen(true);
  };

  const handleEditQuestionChoice = (questionChoice: QuestionChoice) => {
    setSelectedQuestionChoice(questionChoice);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedQuestionChoice(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedQuestionChoice(null);
  };

  const handleQuestionChoiceSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const getFormModalProps = (
    questionChoice: QuestionChoice | null,
    mode: "create" | "edit"
  ) => {
    return {
      questionChoice: questionChoice,
      mode: mode,
      onQuestionChoiceSaved: handleQuestionChoiceSaved,
    };
  };

  const getViewModalProps = (questionChoice: QuestionChoice | null) => {
    return {
      questionChoice: questionChoice,
    };
  };

  const configWithHandlers = {
    ...questionChoiceTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedQuestionChoice(null);
      setFormModalOpen(true);
    },
  };

  const destructive = useContentManagementDestructiveActions<QuestionChoice>({
    entitySingular: "question choice",
    entityPlural: "question choices",
    deletePermanent: (id) => choicesService.deletePermanent(id),
    refetch,
    skipDeactivate: true,
  });

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={questionChoices}
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
      onView={handleViewQuestionChoice}
      onEdit={handleEditQuestionChoice}
      showDeactivateAction={false}
      onDeletePermanent={destructive.onDeletePermanent}
      onBulkDeletePermanent={destructive.onBulkDeletePermanent}
      FormModal={QuestionChoiceFormModal}
      ViewModal={QuestionChoiceViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedQuestionChoice}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleQuestionChoiceSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

