import React, { useMemo, useState } from "react";
import useProductSubtypes from "../../../hooks/useProductSubtypes";
import useProductSubtypeStats from "../../../hooks/useProductSubtypeStats";
import {
  ProductSubtype,
  ProductSubtypeQueryParams,
} from "../../types/product";
import DataManagementContent from "../../../shared/components/DataTable/DataManagementContent";
import { productSubtypeTableConfig } from "../../config/tables/product-subtype-table.config";
import ProductSubtypeFormModal from "./ProductSubtypeFormModal";
import ProductSubtypeViewModal from "./ProductSubtypeViewModal";
import { ProductSubtypesService } from "../../services/products/product-subtypes.service";
import { useContentManagementDestructiveActions } from "../../../hooks/useContentManagementDestructiveActions";

export default function ProductSubtypeManagementContent() {
  const subtypesService = useMemo(() => new ProductSubtypesService(), []);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedSubtype, setSelectedSubtype] = useState<ProductSubtype | null>(null);

  const {
    subtypes,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  } = useProductSubtypes({
    page: 1,
    limit: 10,
  });

  const {
    stats,
    loading: statsLoading,
  } = useProductSubtypeStats();

  const handleFiltersChange = (newFilters: Partial<any>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
      productId: undefined,
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
      sortBy: sortBy as ProductSubtypeQueryParams["sortBy"],
      sortOrder,
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewSubtype = (subtype: ProductSubtype) => {
    setSelectedSubtype(subtype);
    setViewModalOpen(true);
  };

  const handleEditSubtype = (subtype: ProductSubtype) => {
    setSelectedSubtype(subtype);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedSubtype(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedSubtype(null);
  };

  const handleSubtypeSaved = () => {
    refetch();
    handleCloseFormModal();
  };

  const getFormModalProps = (subtype: ProductSubtype | null, mode: "create" | "edit") => {
    return {
      subtype: subtype,
      mode: mode,
      onSubtypeSaved: handleSubtypeSaved,
    };
  };

  const getViewModalProps = (subtype: ProductSubtype | null) => {
    return {
      subtype: subtype,
    };
  };

  const configWithHandlers = {
    ...productSubtypeTableConfig,
    onAdd: () => {
      setFormMode("create");
      setSelectedSubtype(null);
      setFormModalOpen(true);
    },
  };

  const destructive = useContentManagementDestructiveActions<ProductSubtype>({
    entitySingular: "product subtype",
    entityPlural: "product subtypes",
    deactivate: (id) => subtypesService.delete(id),
    deletePermanent: (id) => subtypesService.deletePermanent(id),
    refetch,
  });

  return (
    <DataManagementContent
      config={configWithHandlers}
      data={subtypes}
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
      onView={handleViewSubtype}
      onEdit={handleEditSubtype}
      onDeactivate={destructive.onDeactivate}
      onDeletePermanent={destructive.onDeletePermanent}
      onBulkDeletePermanent={destructive.onBulkDeletePermanent}
      FormModal={ProductSubtypeFormModal}
      ViewModal={ProductSubtypeViewModal}
      formModalOpen={formModalOpen}
      viewModalOpen={viewModalOpen}
      selectedItem={selectedSubtype}
      formMode={formMode}
      onCloseFormModal={handleCloseFormModal}
      onCloseViewModal={handleCloseViewModal}
      onItemSaved={handleSubtypeSaved}
      getFormModalProps={getFormModalProps}
      getViewModalProps={getViewModalProps}
    />
  );
}

