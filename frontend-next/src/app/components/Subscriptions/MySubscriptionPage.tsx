import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  ArrowUp,
  Trash2,
  Info,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Subscription, SubscriptionStatus, SubscriptionPackage } from "../../types/subscription";
import { SubscriptionsService } from "../../services/subscriptions/subscriptions.service";
import { SubscriptionPackagesService } from "../../services/subscriptions/subscription-packages.service";
import { authService } from "../../../shared/services/auth.service";
import { Button } from "../../../shared/ui/button";
import { useRouter } from "next/router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shared/ui/alert-dialog";
import { Switch } from "../../../shared/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Badge } from "../../../shared/ui/badge";
import { Alert, AlertDescription } from "../../../shared/ui/alert";

export default function MySubscriptionPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [availablePackages, setAvailablePackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null);
  const [packageToUpgrade, setPackageToUpgrade] = useState<SubscriptionPackage | null>(null);
  const subscriptionsService = new SubscriptionsService();
  const packagesService = new SubscriptionPackagesService();

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.replace("/login");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = authService.getCurrentUser();
      if (!user?.id) {
        setError("User not found");
        return;
      }

      // Load subscriptions and available packages in parallel
      const [userSubscriptions, packages] = await Promise.all([
        subscriptionsService.getUserSubscriptions(user.id),
        packagesService.getPackages({ status: "ACTIVE" }),
      ]);

      setSubscriptions(Array.isArray(userSubscriptions) ? userSubscriptions : []);
      setAvailablePackages(Array.isArray(packages) ? packages : []);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load subscription data");
    } finally {
      setLoading(false);
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

  const handleUpgrade = (pkg: SubscriptionPackage) => {
    setPackageToUpgrade(pkg);
    setShowUpgradeDialog(true);
  };

  const confirmUpgrade = async () => {
    if (!packageToUpgrade || !activeSubscription) return;

    try {
      setActionLoading("upgrade");
      // Navigate to checkout with the new package
      router.push(`/checkout-basic?packageId=${packageToUpgrade.id}`);
    } catch (err: any) {
      console.error("Error initiating upgrade:", err);
      alert(err.message || "Failed to initiate upgrade");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = (subscription: Subscription) => {
    setSubscriptionToCancel(subscription);
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    if (!subscriptionToCancel) return;

    try {
      setActionLoading("cancel");
      await subscriptionsService.cancelSubscription(subscriptionToCancel.id);
      await loadData(); // Reload subscriptions
      setShowCancelDialog(false);
      setSubscriptionToCancel(null);
    } catch (err: any) {
      console.error("Error cancelling subscription:", err);
      alert(err.message || "Failed to cancel subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAutoRenew = async (subscription: Subscription) => {
    try {
      setActionLoading(`autoRenew-${subscription.id}`);
      await subscriptionsService.updateSubscription(subscription.id, {
        autoRenew: !subscription.autoRenew,
      });
      await loadData(); // Reload subscriptions
    } catch (err: any) {
      console.error("Error updating auto-renew:", err);
      alert(err.message || "Failed to update auto-renew setting");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = (subscription: Subscription) => {
    // Navigate to checkout with the same package
    if (subscription.subscriptionPackageId) {
      router.push(`/checkout-basic?packageId=${subscription.subscriptionPackageId}`);
    }
  };

  const getBetterPackages = (currentPackage: SubscriptionPackage | undefined) => {
    if (!currentPackage) return [];
    return availablePackages.filter(
      (pkg) =>
        pkg.id !== currentPackage.id &&
        pkg.isActive &&
        (pkg.price > currentPackage.price || 
         pkg.validityDays > currentPackage.validityDays ||
         (pkg.subscriptionFeatures?.length || 0) > (currentPackage.subscriptionFeatures?.length || 0))
    );
  };

  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "ACTIVE"
  );
  const hasActiveSubscription = !!activeSubscription;
  const betterPackages = getBetterPackages(activeSubscription?.subscriptionPackage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <CreditCard className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
                My Subscription
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your subscription, upgrade plans, and view billing details
              </p>
            </div>
            <Button
              onClick={() => router.push("/landing-page#pricing")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Info className="h-4 w-4 mr-2" />
              View All Plans
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            <Button onClick={loadData} variant="outline" className="mt-4">
              Retry
            </Button>
          </Alert>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Subscription Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                You don&apos;t have any active subscriptions. Subscribe now to unlock
                full access to all features.
              </p>
              <Button
                onClick={() => router.push("/landing-page#pricing")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Subscription Banner */}
            {hasActiveSubscription && activeSubscription && (
              <Alert className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertDescription className="flex items-center justify-between w-full">
                  <div>
                    <span className="font-semibold text-green-800 dark:text-green-300">
                      Active Subscription
                    </span>
                    <span className="ml-3 text-sm text-green-700 dark:text-green-400">
                      {activeSubscription.subscriptionPackage?.name} - Expires {formatDate(activeSubscription.endDate)}
                    </span>
                  </div>
                  <Badge className={getStatusColor(activeSubscription.status)}>
                    {activeSubscription.status}
                  </Badge>
                </AlertDescription>
              </Alert>
            )}

            {/* Upgrade Options */}
            {hasActiveSubscription && betterPackages.length > 0 && (
              <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
                    <ArrowUp className="h-5 w-5 mr-2" />
                    Better Plans Available
                  </CardTitle>
                  <CardDescription>
                    Upgrade to unlock more features and benefits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {betterPackages.slice(0, 3).map((pkg) => (
                      <Card key={pkg.id} className="border-blue-300 dark:border-blue-700">
                        <CardHeader>
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          <CardDescription>{pkg.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              ${pkg.price}
                              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                /{pkg.validityDays} days
                              </span>
                            </p>
                            {pkg.subscriptionFeatures && pkg.subscriptionFeatures.length > 0 && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {pkg.subscriptionFeatures.length} features included
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => handleUpgrade(pkg)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={actionLoading === "upgrade"}
                          >
                            {actionLoading === "upgrade" ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <ArrowUp className="h-4 w-4 mr-2" />
                                Upgrade Now
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subscriptions List */}
            <div className="space-y-6">
              {subscriptions.map((subscription) => {
                const isActionLoading = actionLoading?.startsWith(`autoRenew-${subscription.id}`);
                const canUpgrade = subscription.status === "ACTIVE" && betterPackages.length > 0;
                const canCancel = subscription.status === "ACTIVE" || subscription.status === "PENDING";
                const canRenew = subscription.status === "EXPIRED";

                return (
                  <Card key={subscription.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center flex-1">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                            <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl">
                              {subscription.subscriptionPackage?.name ||
                                "Subscription Package"}
                            </CardTitle>
                            <CardDescription>
                              Subscription #{subscription.id.slice(0, 8)}
                              {subscription.subscriptionPackage && (
                                <span className="ml-2">
                                  • ${subscription.subscriptionPackage.price} / {subscription.subscriptionPackage.validityDays} days
                                </span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Start Date
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatDate(subscription.endDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <RefreshCw className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Auto Renew
                                </p>
                                <Badge
                                  className={
                                    subscription.autoRenew
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                  }
                                >
                                  {subscription.autoRenew ? "Enabled" : "Disabled"}
                                </Badge>
                              </div>
                              {subscription.status === "ACTIVE" && (
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={subscription.autoRenew}
                                    onCheckedChange={() => handleToggleAutoRenew(subscription)}
                                    disabled={isActionLoading}
                                  />
                                  {isActionLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Created
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatDateTime(subscription.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Package Features */}
                      {subscription.subscriptionPackage?.subscriptionFeatures &&
                        subscription.subscriptionPackage.subscriptionFeatures.length > 0 && (
                          <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Included Features:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {subscription.subscriptionPackage.subscriptionFeatures.map(
                                (feature: any, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                                  >
                                    {feature.packageFeature?.name || feature.name}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        {canUpgrade && (
                          <Button
                            onClick={() => handleUpgrade(betterPackages[0])}
                            variant="outline"
                            disabled={actionLoading === "upgrade"}
                          >
                            {actionLoading === "upgrade" ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <ArrowUp className="h-4 w-4 mr-2" />
                                Upgrade Plan
                              </>
                            )}
                          </Button>
                        )}
                        {canRenew && (
                          <Button
                            onClick={() => handleRenew(subscription)}
                            variant="outline"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Renew Subscription
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            onClick={() => handleCancel(subscription)}
                            variant="destructive"
                            disabled={actionLoading === "cancel"}
                          >
                            {actionLoading === "cancel" ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this subscription? 
              {subscriptionToCancel?.autoRenew && (
                <span className="block mt-2 text-yellow-600 dark:text-yellow-400">
                  ⚠️ Auto-renewal will be disabled. Your subscription will remain active until {subscriptionToCancel && formatDate(subscriptionToCancel.endDate)}.
                </span>
              )}
              {!subscriptionToCancel?.autoRenew && subscriptionToCancel && (
                <span className="block mt-2">
                  Your subscription will be cancelled immediately and you&apos;ll lose access on {formatDate(subscriptionToCancel.endDate)}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === "cancel"}>
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading === "cancel"}
            >
              {actionLoading === "cancel" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Confirmation Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upgrade Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              {packageToUpgrade && (
                <>
                  You're about to upgrade to <strong>{packageToUpgrade.name}</strong>.
                  <div className="mt-3 space-y-2">
                    <p className="text-sm">
                      <strong>Price:</strong> ${packageToUpgrade.price} {packageToUpgrade.currency}
                    </p>
                    <p className="text-sm">
                      <strong>Validity:</strong> {packageToUpgrade.validityDays} days
                    </p>
                    {packageToUpgrade.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {packageToUpgrade.description}
                      </p>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ Your current subscription will be cancelled and replaced with the new one.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === "upgrade"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpgrade}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={actionLoading === "upgrade"}
            >
              {actionLoading === "upgrade" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

