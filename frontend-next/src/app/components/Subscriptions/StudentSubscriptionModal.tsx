import React, { useEffect, useState } from "react";
import {
  X,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  Package,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Subscription, SubscriptionStatus } from "../../types/subscription";
import { SubscriptionsService } from "../../services/subscriptions/subscriptions.service";
import { authService } from "../../../shared/services/auth.service";
import { Button } from "../../../shared/ui/button";
import { useRouter } from "next/router";

interface StudentSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentSubscriptionModal({
  isOpen,
  onClose,
}: StudentSubscriptionModalProps) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionsService = new SubscriptionsService();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      loadSubscriptions();
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = authService.getCurrentUser();
      if (!user?.id) {
        setError("User not found");
        return;
      }

      const userSubscriptions = await subscriptionsService.getUserSubscriptions(
        user.id
      );
      setSubscriptions(userSubscriptions || []);
    } catch (err: any) {
      console.error("Error loading subscriptions:", err);
      setError(err.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

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
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "SUSPENDED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "PENDING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const handleUpgrade = () => {
    onClose();
    router.push("/landing-page#pricing");
  };

  if (!isOpen) return null;

  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "ACTIVE"
  );
  const hasActiveSubscription = !!activeSubscription;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 dark:bg-opacity-70"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              My Subscription
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Loading subscription...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={loadSubscriptions} variant="outline">
                Retry
              </Button>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Subscription Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                You don't have any active subscriptions. Subscribe now to unlock
                full access to all features.
              </p>
              <Button onClick={handleUpgrade} className="bg-blue-600 hover:bg-blue-700">
                <CreditCard className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </div>
          ) : (
            <>
              {/* Active Subscription Highlight */}
              {hasActiveSubscription && activeSubscription && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                      <span className="font-semibold text-green-800 dark:text-green-300">
                        Active Subscription
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                        activeSubscription.status
                      )}`}
                    >
                      {activeSubscription.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Subscriptions List */}
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                          <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {subscription.subscriptionPackage?.name ||
                              "Subscription Package"}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Subscription #{subscription.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Start Date
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(subscription.startDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            End Date
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(subscription.endDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <RefreshCw className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Auto Renew
                          </p>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              subscription.autoRenew
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {subscription.autoRenew ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Created
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDateTime(subscription.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Package Features */}
                    {subscription.subscriptionPackage?.features &&
                      subscription.subscriptionPackage.features.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Features:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {subscription.subscriptionPackage.features.map(
                              (feature: any, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                                >
                                  {feature.feature?.name || feature.name}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                {!hasActiveSubscription && (
                  <Button
                    onClick={handleUpgrade}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                )}
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

