import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Package,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Tag,
  X as XIcon,
} from "lucide-react";
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
} from "../../types/product";
import { ProductsService } from "../../services/products/products.service";
import { CategoriesService } from "../../services/categories/categories.service";
import { Category } from "../../types/category";
import { CreateResponse } from "../../services/base/api-types";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onProductSaved: (product: Product) => void;
  mode: "create" | "edit";
}

export default function ProductFormModal({
  isOpen,
  onClose,
  product,
  onProductSaved,
  mode,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<CreateProductDto>({
    name: "",
    description: "",
    isActive: true,
    categoryId: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const productsService = useMemo(() => new ProductsService(), []);
  const categoriesService = useMemo(() => new CategoriesService(), []);
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      // Load categories
      categoriesService.getCategories()
        .then((response) => {
          if (Array.isArray(response)) {
            setCategories(response);
          } else {
            setCategories(response.data || []);
          }
        })
        .catch(() => setCategories([]));

      if (isCreateMode) {
        setFormData({
          name: "",
          description: "",
          isActive: true,
          categoryId: "",
        });
      } else if (product) {
        setFormData({
          name: product.name,
          description: product.description || "",
          isActive: product.isActive,
          categoryId: (product as any).categoryId || "",
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, product, isCreateMode, categoriesService]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Product name is required";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (isCreateMode) {
        const createData: any = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          categoryId: formData.categoryId || undefined,
        };
        const response = await productsService.createProduct(createData);
        setSuccess(true);
        setTimeout(() => {
          if ("name" in response && !("message" in response)) {
            onProductSaved(response as Product);
            onClose();
          } else {
            const createResponse = response as CreateResponse;
            productsService
              .getProduct(createResponse.id)
              .then((entity) => {
                onProductSaved(entity);
                onClose();
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      } else if (product) {
        const updateData: any = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          categoryId: formData.categoryId === "" ? null : formData.categoryId,
        };
        const response = await productsService.updateProduct(
          product.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          if ("name" in response && !("message" in response)) {
            onProductSaved(response as Product);
            onClose();
          } else {
            productsService
              .getProduct(product.id)
              .then((entity) => {
                onProductSaved(entity);
                onClose();
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save product"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Create Product" : "Edit Product"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700">Product saved successfully!</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="categoryId"
                value={formData.categoryId || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Category / Unassigned</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                  </option>
                ))}
              </select>
            </div>



            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreateMode ? "Create" : "Update"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

