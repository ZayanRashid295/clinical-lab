import React, { useState, useEffect } from "react";
import {
  X,
  Layers,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Package,
} from "lucide-react";
import {
  ProductSubtype,
  CreateProductSubtypeDto,
  UpdateProductSubtypeDto,
} from "../../types/product";
import { ProductSubtypesService } from "../../services/products/product-subtypes.service";
import { ProductsService } from "../../services/products/products.service";
import { Product } from "../../types/product";

interface ProductSubtypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtype?: ProductSubtype | null;
  onSubtypeSaved: (subtype: ProductSubtype) => void;
  mode: "create" | "edit";
}

export default function ProductSubtypeFormModal({
  isOpen,
  onClose,
  subtype,
  onSubtypeSaved,
  mode,
}: ProductSubtypeFormModalProps) {
  const [formData, setFormData] = useState<CreateProductSubtypeDto>({
    productId: "",
    name: "",
    description: "",
    isActive: true,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const subtypesService = new ProductSubtypesService();
  const productsService = new ProductsService();
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      // Load products
      setLoadingProducts(true);
      productsService
        .getProducts({ limit: 100, status: "ACTIVE" })
        .then((response) => {
          if (Array.isArray(response)) {
            setProducts(response);
          } else {
            setProducts(response.data || []);
          }
        })
        .catch(() => {
          setProducts([]);
        })
        .finally(() => {
          setLoadingProducts(false);
        });

      if (isCreateMode) {
        setFormData({
          productId: "",
          name: "",
          description: "",
          isActive: true,
        });
      } else if (subtype) {
        setFormData({
          productId: subtype.productId,
          name: subtype.name,
          description: subtype.description || "",
          isActive: subtype.isActive,
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, subtype, isCreateMode]);

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
    if (!formData.productId.trim()) {
      return "Product is required";
    }
    if (!formData.name.trim()) {
      return "Subtype name is required";
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
        const response = await subtypesService.createSubtype(formData);
        setSuccess(true);
        setTimeout(() => {
          onSubtypeSaved(response.data || response);
          onClose();
        }, 1000);
      } else if (subtype) {
        const updateData: UpdateProductSubtypeDto = {
          productId: formData.productId,
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
        };
        const response = await subtypesService.updateSubtype(
          subtype.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          onSubtypeSaved(response.data || response);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save product subtype"
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
            <Layers className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Create Product Subtype" : "Edit Product Subtype"}
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
              <span className="text-green-700">
                Subtype saved successfully!
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              {loadingProducts ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading products...
                </div>
              ) : (
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtype Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
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
              disabled={loading || loadingProducts}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

