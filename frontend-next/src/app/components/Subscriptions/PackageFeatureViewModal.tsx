import React, { useEffect } from "react";
import {
  X,
  Star,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PackageFeature } from "../../types/subscription";

interface PackageFeatureViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: PackageFeature | null;
}

export default function PackageFeatureViewModal({
  isOpen,
  onClose,
  feature,
}: PackageFeatureViewModalProps) {
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
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  if (!isOpen || !feature) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Star className="h-6 w-6 text-yellow-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Feature Details
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
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{feature.name}</h3>
              {feature.description && (
                <p className="text-gray-600 mt-1">{feature.description}</p>
              )}
              <div className="flex items-center mt-2">
                {getStatusIcon(feature.isActive)}
                <span
                  className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    feature.isActive
                  )}`}
                >
                  {feature.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Feature Information
              </h4>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{feature.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-gray-900">
                    {feature.description || "No description provided"}
                  </p>
                </div>

                <div className="flex items-center">
                  {getStatusIcon(feature.isActive)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        feature.isActive
                      )}`}
                    >
                      {feature.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
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
                    <p className="text-gray-900">{formatDate(feature.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Last Updated
                    </p>
                    <p className="text-gray-900">
                      {formatDateTime(feature.updatedAt)}
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

