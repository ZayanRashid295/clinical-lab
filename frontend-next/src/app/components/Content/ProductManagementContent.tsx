import React, { useMemo, useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import useProducts from "../../../hooks/useProducts";
import useProductStats from "../../../hooks/useProductStats";
import { Product, ProductQueryParams } from "../../types/product";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { productTableConfig } from "../../config/tables/product-table.config";
import ProductFormModal from "./ProductFormModal";
import ProductViewModal from "./ProductViewModal";
import { ProductsService } from "../../services/products/products.service";
import { useContentManagementDestructiveActions } from "../../../hooks/useContentManagementDestructiveActions";

export default function ProductManagementContent() {
  const productsService = useMemo(() => new ProductsService(), []);
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
    updateFilters({
      sortBy: sortBy as ProductQueryParams["sortBy"],
      sortOrder,
    });
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

  const getFormModalProps = (product: Product | null, mode: "create" | "edit") => {
    return {
      product: product,
      mode: mode,
      onProductSaved: handleProductSaved,
    };
  };

  const getViewModalProps = (product: Product | null) => {
    return {
      product: product,
    };
  };

  const configWithHandlers = {
    ...productTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedProduct(null);
      setFormModalOpen(true);
    },
  };

  const destructive = useContentManagementDestructiveActions<Product>({
    entitySingular: "product",
    entityPlural: "products",
    deactivate: (id) => productsService.delete(id),
    deletePermanent: (id) => productsService.deletePermanent(id),
    refetch,
  });

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
      onDeactivate={destructive.onDeactivate}
      onDeletePermanent={destructive.onDeletePermanent}
      onBulkDeletePermanent={destructive.onBulkDeletePermanent}
      FormModal={ProductFormModal}
      ViewModal={ProductViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedProduct}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleProductSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

