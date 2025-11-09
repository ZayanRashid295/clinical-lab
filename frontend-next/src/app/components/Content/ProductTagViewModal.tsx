import React, { useEffect } from "react";
import {
  X,
  Tag,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Palette,
} from "lucide-react";
import { ProductTag } from "../../types/product";

interface ProductTagViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: ProductTag | null;
}

export default function ProductTagViewModal({
  isOpen,
  onClose,
  tag,
}: ProductTagViewModalProps) {
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  if (!isOpen || !tag) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Tag className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Product Tag Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
              style={{
                backgroundColor: tag.color || "#9333EA",
              }}
            >
              <Tag className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{tag.name}</h3>
              {tag.description && (
                <p className="text-gray-600 mt-1">{tag.description}</p>
              )}
              <div className="flex items-center mt-2">
                {getStatusIcon(tag.isActive)}
                <span
                  className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    tag.isActive
                  )}`}
                >
                  {tag.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Tag Information
              </h4>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{tag.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Description
                  </p>
                  <p className="text-gray-900">
                    {tag.description || "No description provided"}
                  </p>
                </div>

                <div className="flex items-center">
                  <Palette className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Color</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: tag.color || "#9333EA" }}
                      />
                      <p className="text-gray-900">{tag.color || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  {getStatusIcon(tag.isActive)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        tag.isActive
                      )}`}
                    >
                      {tag.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {tag._count && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Products Count
                      </p>
                      <p className="text-gray-900">{tag._count.products}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Questions Count
                      </p>
                      <p className="text-gray-900">{tag._count.questions}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Metadata
              </h4>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Created At
                    </p>
                    <p className="text-gray-900">{formatDate(tag.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Last Updated
                    </p>
                    <p className="text-gray-900">
                      {formatDateTime(tag.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

