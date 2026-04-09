import React, { useEffect } from "react";
import { X, GraduationCap, Calendar, Link2 } from "lucide-react";
import { Category } from "../../types/category";

interface CategoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

export default function CategoryViewModal({
  isOpen,
  onClose,
  category,
}: CategoryViewModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
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

  if (!isOpen || !category) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <GraduationCap className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Category Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-indigo-100 flex items-center justify-center text-3xl">
              {category.icon || "📚"}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {category.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Link2 className="h-4 w-4 text-gray-400" />
                <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                  {category.slug}
                </code>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  category.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {category.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Display Order</p>
              <p className="text-sm font-medium text-gray-900">
                {category.order}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-sm font-medium text-gray-900">
                {category._count?.products ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">
                  {new Intl.DateTimeFormat("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(category.createdAt))}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {category.description && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-900">
                {category.description}
              </p>
            </div>
          )}

          {/* Products list */}
          {category.products && category.products.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Products</p>
              <div className="space-y-1">
                {category.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm text-gray-900">
                      {product.name}
                    </span>
                    {product.description && (
                      <span className="text-xs text-gray-500">
                        — {product.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
