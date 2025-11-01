import React, { useState, useEffect } from "react";
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
  ProductTag,
} from "../../types/product";
import { ProductsService } from "../../services/products/products.service";
import { ProductTagsService } from "../../services/products/product-tags.service";

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
    tagIds: [],
  });
  const [availableTags, setAvailableTags] = useState<ProductTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const productsService = new ProductsService();
  const tagsService = new ProductTagsService();
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      // Load available tags
      setLoadingTags(true);
      tagsService
        .getTags({ limit: 100, status: "ACTIVE" })
        .then((response) => {
          if (Array.isArray(response)) {
            setAvailableTags(response);
          } else {
            setAvailableTags(response.data || []);
          }
        })
        .catch(() => {
          setAvailableTags([]);
        })
        .finally(() => {
          setLoadingTags(false);
        });

      if (isCreateMode) {
        setFormData({
          name: "",
          description: "",
          isActive: true,
          tagIds: [],
        });
      } else if (product) {
        setFormData({
          name: product.name,
          description: product.description || "",
          isActive: product.isActive,
          tagIds: product.productTags?.map((tag) => tag.id) || [],
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, product, isCreateMode]);

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
        const createData: CreateProductDto = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          tagIds: formData.tagIds,
        };
        const response = await productsService.createProduct(createData);
        setSuccess(true);
        setTimeout(() => {
          onProductSaved(response.data || response);
          onClose();
        }, 1000);
      } else if (product) {
        const updateData: UpdateProductDto = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          tagIds: formData.tagIds,
        };
        const response = await productsService.updateProduct(
          product.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          onProductSaved(response.data || response);
          onClose();
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              {loadingTags ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading tags...
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    onChange={(e) => {
                      const tagId = e.target.value;
                      if (tagId && !formData.tagIds?.includes(tagId)) {
                        setFormData((prev) => ({
                          ...prev,
                          tagIds: [...(prev.tagIds || []), tagId],
                        }));
                        e.target.value = "";
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a tag to add</option>
                    {availableTags
                      .filter((tag) => !formData.tagIds?.includes(tag.id))
                      .map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                  </select>
                  {formData.tagIds && formData.tagIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tagIds.map((tagId) => {
                        const tag = availableTags.find((t) => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <span
                            key={tagId}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            style={{
                              backgroundColor: tag.color
                                ? `${tag.color}20`
                                : undefined,
                              color: tag.color || undefined,
                            }}
                          >
                            <Tag className="h-3 w-3" />
                            {tag.name}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  tagIds: prev.tagIds?.filter(
                                    (id) => id !== tagId
                                  ) || [],
                                }));
                              }}
                              className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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

