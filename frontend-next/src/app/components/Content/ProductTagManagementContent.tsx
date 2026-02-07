import React, { useState } from "react";
import useProductTags from "../../../hooks/useProductTags";
import useProductTagStats from "../../../hooks/useProductTagStats";
import { ProductTag, ProductTagQueryParams } from "../../types/product";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { productTagTableConfig } from "../../config/tables/product-tag-table.config";
import ProductTagFormModal from "./ProductTagFormModal";
import ProductTagViewModal from "./ProductTagViewModal";
import { ProductTagsService } from "../../services/products/product-tags.service";

export default function ProductTagManagementContent() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedTag, setSelectedTag] = useState<ProductTag | null>(null);

  const {
    tags,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useProductTags({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
  } = useProductTagStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
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
      sortBy: sortBy as ProductTagQueryParams["sortBy"],
      sortOrder,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewTag = (tag: ProductTag) => {
    setSelectedTag(tag);
    setViewModalOpen(true);
  };

  const handleEditTag = (tag: ProductTag) => {
    setSelectedTag(tag);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedTag(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedTag(null);
  };

  const handleTagSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const getFormModalProps = (tag: ProductTag | null, mode: "create" | "edit") => {
    return {
      tag: tag,
      mode: mode,
      onTagSaved: handleTagSaved,
    };
  };

  const getViewModalProps = (tag: ProductTag | null) => {
    return {
      tag: tag,
    };
  };

  const configWithHandlers = {
    ...productTagTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedTag(null);
      setFormModalOpen(true);
    },
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={tags}
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
      onView={handleViewTag}
      onEdit={handleEditTag}
      FormModal={ProductTagFormModal}
      ViewModal={ProductTagViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedTag}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleTagSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

