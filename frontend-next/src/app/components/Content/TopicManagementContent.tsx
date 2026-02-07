import React, { useState } from "react";
import useTopics from "../../../hooks/useTopics";
import useTopicStats from "../../../hooks/useTopicStats";
import { Topic, TopicQueryParams } from "../../types/content";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { topicTableConfig } from "../../config/tables/topic-table.config";
import TopicFormModal from "./TopicFormModal";
import TopicViewModal from "./TopicViewModal";
import { TopicsService } from "../../services/content/topics.service";

export default function TopicManagementContent() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const {
    topics,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useTopics({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
  } = useTopicStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      chapterId: undefined,
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
      sortBy: sortBy as TopicQueryParams["sortBy"],
      sortOrder,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setViewModalOpen(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedTopic(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedTopic(null);
  };

  const handleTopicSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const getFormModalProps = (topic: Topic | null, mode: "create" | "edit") => {
    return {
      topic: topic,
      mode: mode,
      onTopicSaved: handleTopicSaved,
    };
  };

  const getViewModalProps = (topic: Topic | null) => {
    return {
      topic: topic,
    };
  };

  const configWithHandlers = {
    ...topicTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedTopic(null);
      setFormModalOpen(true);
    },
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={topics}
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
      onView={handleViewTopic}
      onEdit={handleEditTopic}
      FormModal={TopicFormModal}
      ViewModal={TopicViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedTopic}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleTopicSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

