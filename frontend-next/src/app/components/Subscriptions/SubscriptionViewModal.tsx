import React, { useEffect } from "react";
import {
  X,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  User,
  Package,
  RefreshCw,
} from "lucide-react";
import { Subscription, SubscriptionStatus } from "../../types/subscription";

interface SubscriptionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
}

export default function SubscriptionViewModal({
  isOpen,
  onClose,
  subscription,
}: SubscriptionViewModalProps) {
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

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "SUSPENDED":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen || !subscription) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Subscription Details
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                Subscription #{subscription.id.slice(0, 8)}
              </h3>
              <div className="flex items-center mt-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    subscription.status
                  )}`}
                >
                  {subscription.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Subscription Information
              </h4>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      subscription.status
                    )}`}
                  >
                    {subscription.status}
                  </span>
                </div>

                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">User</p>
                    <p className="text-gray-900">
                      {subscription.user
                        ? `${subscription.user.firstName} ${subscription.user.lastName}`
                        : subscription.userId}
                    </p>
                    {subscription.user?.email && (
                      <p className="text-sm text-gray-500">
                        {subscription.user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Package</p>
                    <p className="text-gray-900">
                      {subscription.subscriptionPackage?.name ||
                        subscription.subscriptionPackageId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Dates & Settings
              </h4>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Start Date
                    </p>
                    <p className="text-gray-900">
                      {formatDate(subscription.startDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      End Date
                    </p>
                    <p className="text-gray-900">
                      {formatDate(subscription.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Auto Renew
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        subscription.autoRenew
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {subscription.autoRenew ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Created At
                    </p>
                    <p className="text-gray-900">
                      {formatDateTime(subscription.createdAt)}
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

