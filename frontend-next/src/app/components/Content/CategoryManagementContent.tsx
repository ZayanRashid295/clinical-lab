import React, { useMemo, useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import useCategories from "../../../hooks/useCategories";
import useCategoryStats from "../../../hooks/useCategoryStats";
import { Category, CategoryQueryParams } from "../../types/category";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { categoryTableConfig } from "../../config/tables/category-table.config";
import CategoryFormModal from "./CategoryFormModal";
import CategoryViewModal from "./CategoryViewModal";
import { CategoriesService } from "../../services/categories/categories.service";
import { useContentManagementDestructiveActions } from "../../../hooks/useContentManagementDestructiveActions";

export default function CategoryManagementContent() {
  const { config } = useTheme();
  const categoriesService = useMemo(() => new CategoriesService(), []);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const {
    categories,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useCategories({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useCategoryStats();

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
      sortBy: sortBy as CategoryQueryParams["sortBy"],
      sortOrder,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleView = (item: Category) => {
    setSelectedCategory(item);
    setViewModalOpen(true);
  };

  const handleEdit = (item: Category) => {
    setSelectedCategory(item);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedCategory(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedCategory(null);
  };

  const handleItemSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const getFormModalProps = (
    item: Category | null,
    mode: "create" | "edit"
  ) => ({
    category: item,
    mode,
    onCategorySaved: handleItemSaved,
  });

  const getViewModalProps = (item: Category | null) => ({
    category: item,
  });

  const configWithHandlers = {
    ...categoryTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedCategory(null);
      setFormModalOpen(true);
    },
  };

  const destructive = useContentManagementDestructiveActions<Category>({
    entitySingular: "category",
    entityPlural: "categories",
    deletePermanent: (id) => categoriesService.deletePermanent(id),
    refetch,
  });

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={categories}
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
      onView={handleView}
      onEdit={handleEdit}
      onDeletePermanent={destructive.onDeletePermanent}
      onBulkDeletePermanent={destructive.onBulkDeletePermanent}
      FormModal={CategoryFormModal}
      ViewModal={CategoryViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedCategory}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleItemSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}
