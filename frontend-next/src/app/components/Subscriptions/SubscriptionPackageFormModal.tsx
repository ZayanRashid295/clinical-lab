import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  Calendar,
  Tag,
} from "lucide-react";
import {
  SubscriptionPackage,
  CreateSubscriptionPackageDto,
  UpdateSubscriptionPackageDto,
} from "../../types/subscription";
import { SubscriptionPackagesService } from "../../services/subscriptions/subscription-packages.service";
import { CreateResponse } from "../../services/base/api-types";

interface SubscriptionPackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  package?: SubscriptionPackage | null;
  onPackageSaved: (pkg: SubscriptionPackage) => void;
  mode: "create" | "edit";
}

export default function SubscriptionPackageFormModal({
  isOpen,
  onClose,
  package: pkg,
  onPackageSaved,
  mode,
}: SubscriptionPackageFormModalProps) {
  const [formData, setFormData] = useState<CreateSubscriptionPackageDto>({
    productSubtypeId: "",
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    validityDays: 30,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const packagesService = new SubscriptionPackagesService();
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        setFormData({
          productSubtypeId: "",
          name: "",
          description: "",
          price: 0,
          currency: "USD",
          validityDays: 30,
          isActive: true,
        });
      } else if (pkg) {
        setFormData({
          productSubtypeId: pkg.productSubtypeId,
          name: pkg.name,
          description: pkg.description || "",
          price: Number(pkg.price),
          currency: pkg.currency,
          validityDays: pkg.validityDays,
          isActive: pkg.isActive,
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, pkg, isCreateMode]);

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
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.productSubtypeId.trim()) {
      return "Product Subtype ID is required";
    }
    if (!formData.name.trim()) {
      return "Package name is required";
    }
    if (formData.price <= 0) {
      return "Price must be greater than 0";
    }
    if (formData.validityDays <= 0) {
      return "Validity days must be greater than 0";
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
        const response = await packagesService.createPackage(formData);
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either CreateResponse or SubscriptionPackage
          if ("productSubtypeId" in response && "name" in response) {
            // It's a SubscriptionPackage
            onPackageSaved(response);
            onClose();
          } else {
            // It's a CreateResponse, refetch the created entity
            const createResponse = response as CreateResponse;
            packagesService
              .getPackage(createResponse.id)
              .then((entity) => {
                onPackageSaved(entity);
                onClose();
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      } else if (pkg) {
        const updateData: UpdateSubscriptionPackageDto = {
          productSubtypeId: formData.productSubtypeId,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          validityDays: formData.validityDays,
          isActive: formData.isActive,
        };
        const response = await packagesService.updatePackage(
          pkg.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either UpdateResponse or SubscriptionPackage
          if ("productSubtypeId" in response && "name" in response) {
            // It's a SubscriptionPackage
            onPackageSaved(response);
            onClose();
          } else {
            // It's an UpdateResponse, refetch the updated entity
            packagesService
              .getPackage(pkg.id)
              .then((entity) => {
                onPackageSaved(entity);
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
          "Failed to save subscription package"
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
            <Package className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Create Package" : "Edit Package"}
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
              <span className="text-green-700">Package saved successfully!</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Subtype ID *
              </label>
              <input
                type="text"
                name="productSubtypeId"
                value={formData.productSubtypeId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validity Days *
              </label>
              <input
                type="number"
                name="validityDays"
                value={formData.validityDays}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

