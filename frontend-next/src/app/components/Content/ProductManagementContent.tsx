import React, { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import useProducts from "../../../hooks/useProducts";
import useProductStats from "../../../hooks/useProductStats";
import { Product } from "../../types/product";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { productTableConfig } from "../../config/tables/product-table.config";

export default function ProductManagementContent() {
  const { config } = useTheme();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    products,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useProducts({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useProductStats();

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
    updateFilters({ sortBy, sortOrder });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const configWithHandlers = {
    ...productTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedProduct(null);
      setFormModalOpen(true);
    },
  };

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={products}
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
      onView={handleViewProduct}
      onEdit={handleEditProduct}
      FormModal={undefined}
      ViewModal={undefined}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedProduct}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleProductSaved}
      getFormModalProps={undefined}
      getViewModalProps={undefined}
    />
  );
}

