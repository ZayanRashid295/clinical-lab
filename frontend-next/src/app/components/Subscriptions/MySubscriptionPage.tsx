import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Sparkles,
} from "lucide-react";
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionPackage,
} from "../../types/subscription";
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
import { useToast } from "../../../shared/ui/use-toast";
import { Alert, AlertDescription } from "../../../shared/ui/alert";
import {
  includedFeatureCount,
  includedItemsForPackage,
} from "./includedPackageItems";

export default function MySubscriptionPage() {
  const { toast } = useToast();
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
  const subscriptionsService = useMemo(() => new SubscriptionsService(), []);
  const packagesService = useMemo(() => new SubscriptionPackagesService(), []);

  const loadData = useCallback(async () => {
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
  }, [packagesService, subscriptionsService]);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.replace("/");
      return;
    }
    loadData();
  }, [loadData, router]);

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

  const getStatusPillClass = (status: SubscriptionStatus) => {
    switch (status) {
      case "ACTIVE":
        return "text-emerald-900 dark:text-emerald-200 bg-gradient-to-r from-emerald-200/70 to-emerald-100/40 dark:from-emerald-900/40 dark:to-emerald-900/20 ring-1 ring-emerald-200/70 dark:ring-emerald-700/40";
      case "PENDING":
        return "text-sky-900 dark:text-sky-200 bg-gradient-to-r from-sky-200/70 to-sky-100/40 dark:from-sky-900/40 dark:to-sky-900/20 ring-1 ring-sky-200/70 dark:ring-sky-700/40";
      case "SUSPENDED":
        return "text-amber-900 dark:text-amber-200 bg-gradient-to-r from-amber-200/70 to-amber-100/40 dark:from-amber-900/40 dark:to-amber-900/20 ring-1 ring-amber-200/70 dark:ring-amber-700/40";
      case "CANCELLED":
        return "text-rose-900 dark:text-rose-200 bg-gradient-to-r from-rose-200/70 to-rose-100/40 dark:from-rose-900/40 dark:to-rose-900/20 ring-1 ring-rose-200/70 dark:ring-rose-700/40";
      case "EXPIRED":
      default:
        return "text-slate-800 dark:text-slate-200 bg-gradient-to-r from-slate-200/70 to-slate-100/40 dark:from-slate-800/40 dark:to-slate-800/20 ring-1 ring-slate-200/70 dark:ring-slate-700/40";
    }
  };

  const formatMoney = (amount: number, currency?: string) => {
    const maybeCurrency = (currency || "USD").toUpperCase();
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: maybeCurrency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `$${amount}`;
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
      toast({
        title: "Upgrade Failed",
        description: err.message || "Failed to initiate upgrade",
        variant: "destructive",
      });
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
      toast({
        title: "Cancellation Failed",
        description: err.message || "Failed to cancel subscription",
        variant: "destructive",
      });
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
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update auto-renew setting",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
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
              className="bg-primary-600 text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500/35"
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
                className="bg-primary-600 text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500/35"
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
              <div className="mb-6 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/10">
                <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center ring-1 ring-emerald-500/15 dark:ring-emerald-400/15">
                      <CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Active Subscription
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {activeSubscription.subscriptionPackage?.name} · Expires {formatDate(activeSubscription.endDate)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={[
                      "shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
                      getStatusPillClass(activeSubscription.status),
                    ].join(" ")}
                  >
                    {activeSubscription.status}
                  </span>
                </div>
              </div>
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
                            {includedFeatureCount(pkg) > 0 && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {includedFeatureCount(pkg)} features included
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
                const pkg = subscription.subscriptionPackage;
                const includedItems = includedItemsForPackage(pkg);

                return (
                  <Card
                    key={subscription.id}
                    className={[
                      "overflow-hidden border-0 bg-white/65 dark:bg-white/5 backdrop-blur-md",
                      "shadow-[0_18px_45px_-30px_rgba(15,23,42,0.55)]",
                      "ring-1 ring-black/5 dark:ring-white/10",
                      "transition-shadow hover:shadow-[0_22px_55px_-34px_rgba(15,23,42,0.65)]",
                    ].join(" ")}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-sky-500/10 dark:from-blue-400/15 dark:via-indigo-400/10 dark:to-sky-400/10 ring-1 ring-blue-500/10 dark:ring-blue-400/10 flex items-center justify-center shrink-0">
                            <CreditCard className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                                  {pkg?.name || "Subscription Package"}
                                </CardTitle>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                  {pkg ? (
                                    <span className="text-slate-400 dark:text-slate-500">
                                      {pkg.validityDays} days access
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 dark:text-slate-500">
                                      Subscription details
                                    </span>
                                  )}
                                </p>
                              </div>

                              {pkg && (
                                <div className="text-right shrink-0">
                                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                                    {formatMoney(pkg.price, pkg.currency)}
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
                                      /{Math.max(1, Math.round(pkg.validityDays / 365)) === 1 ? "yr" : "term"}
                                    </span>
                                  </div>
                                  <div className="mt-2 flex justify-end">
                                    <span
                                      className={[
                                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
                                        getStatusPillClass(subscription.status),
                                      ].join(" ")}
                                    >
                                      {subscription.status}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {!pkg && (
                          <span
                            className={[
                              "shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
                              getStatusPillClass(subscription.status),
                            ].join(" ")}
                          >
                            {subscription.status}
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                        <div className="lg:col-span-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl bg-white/55 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 px-4 py-3 shadow-[0_10px_25px_-22px_rgba(0,0,0,0.5)]">
                              <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Start Date
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {formatDate(subscription.startDate)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl bg-white/55 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 px-4 py-3 shadow-[0_10px_25px_-22px_rgba(0,0,0,0.5)]">
                              <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    End Date
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {formatDate(subscription.endDate)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl bg-white/55 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 px-4 py-3 shadow-[0_10px_25px_-22px_rgba(0,0,0,0.5)]">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <RefreshCw className="h-5 w-5 text-slate-400" />
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                      Auto Renew
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      {subscription.autoRenew ? "Enabled" : "Disabled"}
                                    </p>
                                  </div>
                                </div>
                                {subscription.status === "ACTIVE" && (
                                  <div className="flex items-center gap-2">
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

                            <div className="rounded-xl bg-white/55 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 px-4 py-3 shadow-[0_10px_25px_-22px_rgba(0,0,0,0.5)]">
                              <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-slate-400" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Created
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {formatDateTime(subscription.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-4">
                          <div className="h-full rounded-2xl bg-gradient-to-br from-slate-50/80 via-sky-50/50 to-indigo-50/40 dark:from-slate-900/30 dark:via-sky-950/20 dark:to-indigo-950/10 ring-1 ring-black/5 dark:ring-white/10 p-5 shadow-[0_18px_45px_-40px_rgba(0,0,0,0.55)]">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                              <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                              <p className="text-sm font-semibold">Included Features</p>
                            </div>
                            {includedItems.length === 0 ? (
                              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                                No features are associated with this plan.
                              </p>
                            ) : (
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                {includedItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex min-w-0 items-start gap-2 rounded-xl bg-white/55 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 px-2.5 py-2 shadow-[0_10px_25px_-22px_rgba(0,0,0,0.5)]"
                                  >
                                    <div className="mt-0.5 h-6 w-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 flex items-center justify-center shrink-0">
                                      <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                                        {item.label}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-6 border-t border-black/5 dark:border-white/10">
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
                  You&apos;re about to upgrade to <strong>{packageToUpgrade.name}</strong>.
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

