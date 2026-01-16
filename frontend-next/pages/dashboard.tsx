import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../src/shared";
import { transportationContentRegistry } from "../src/app/config/content.registry";
import { SubscriptionAcknowledgmentModal } from "../src/app/components/SubscriptionAcknowledgmentModal";
import StudentSubscriptionModal from "../src/app/components/Subscriptions/StudentSubscriptionModal";
import { SubscriptionsService } from "../src/app/services/subscriptions/subscriptions.service";
import { useAccessControl } from "../src/hooks/useAccessControl";
import { Alert, AlertDescription } from "../src/shared/ui/alert";
import { Button } from "../src/shared/ui/button";
import { CreditCard, Lock } from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showAcknowledgmentModal, setShowAcknowledgmentModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const subscriptionsService = new SubscriptionsService();
  const { hasActiveSubscription, loading: accessLoading } = useAccessControl();

  useEffect(() => {
    const checkSubscription = async () => {
      // Check authentication status
      if (!authService.isAuthenticated()) {
        router.replace("/login");
        return;
      }

      try {
        // Get user profile
        const profile = await authService.getProfile();
        if (!profile?.id) {
          setIsLoading(false);
          return;
        }

        // First, check for active subscriptions
        const activeSubscriptions = await subscriptionsService.getUserSubscriptions(
          profile.id,
          "ACTIVE"
        );

        // If multiple active subscriptions found, clean them up
        if (activeSubscriptions && activeSubscriptions.length > 1) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `⚠️ Found ${activeSubscriptions.length} active subscriptions for user ${profile.id}. Cleaning up duplicates...`
            );
          }
          try {
            // Call cleanup method to fix duplicates
            const cleanupResult = await subscriptionsService.cleanupDuplicateActiveSubscriptions(profile.id);
            if (process.env.NODE_ENV === "development") {
              console.log("✅ Cleaned up duplicate active subscriptions:", cleanupResult);
            }
            
            // Re-fetch active subscriptions after cleanup
            const cleanedSubscriptions = await subscriptionsService.getUserSubscriptions(
              profile.id,
              "ACTIVE"
            );
            
            // Show modal if no active subscription after cleanup
            if (!cleanedSubscriptions || cleanedSubscriptions.length === 0) {
              setShowAcknowledgmentModal(true);
            }
          } catch (cleanupError) {
            if (process.env.NODE_ENV === "development") {
              console.error("Error cleaning up duplicate subscriptions:", cleanupError);
            }
            // Continue with original check
            if (!activeSubscriptions || activeSubscriptions.length === 0) {
              setShowAcknowledgmentModal(true);
            }
          }
        } else {
          // Show modal if no active subscription (informational, not blocking)
          if (!activeSubscriptions || activeSubscriptions.length === 0) {
            // Show modal after a short delay to let dashboard render first
            setTimeout(() => {
              setShowAcknowledgmentModal(true);
            }, 1000);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error checking subscription:", error);
        }
        // On error, don't show modal (fail silently)
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();

    // Listen for subscription modal open event
    const handleOpenSubscriptionModal = () => {
      setShowSubscriptionModal(true);
    };

    window.addEventListener("open-subscription-modal", handleOpenSubscriptionModal);

    // Check if we should show subscription modal after successful subscription
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("subscriptionSuccess") === "true") {
      setShowSubscriptionModal(true);
      // Clean up URL
      router.replace("/dashboard", undefined, { shallow: true });
    }

    return () => {
      window.removeEventListener("open-subscription-modal", handleOpenSubscriptionModal);
    };
  }, [router]);

  if (isLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubscribe = () => {
    setShowAcknowledgmentModal(false);
    router.push("/landing-page#pricing");
  };

  const handleAccessAccount = () => {
    setShowAcknowledgmentModal(false);
    // Dashboard is already shown, just close modal
  };

  return (
    <>
      <Head>
        <title>Dashboard - Clinical Lab</title>
        <meta
          name="description"
          content="Main dashboard with key metrics and insights"
        />
      </Head>

      <SubscriptionAcknowledgmentModal
        isOpen={showAcknowledgmentModal}
        onClose={() => setShowAcknowledgmentModal(false)}
        onSubscribe={handleSubscribe}
        onAccessAccount={handleAccessAccount}
      />

      <StudentSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Show upgrade banner if no active subscription */}
      {!hasActiveSubscription && (
        <div className="sticky top-0 z-40 w-full border-b border-yellow-200 dark:border-yellow-800">
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-none m-0">
            <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="flex items-center justify-between w-full py-2">
              <span className="text-yellow-800 dark:text-yellow-200 text-sm flex-1">
                <strong>No Active Subscription:</strong> You can view the dashboard, but features require an active subscription. 
                Upgrade to unlock full access.
              </span>
              <Button
                onClick={() => {
                  setShowAcknowledgmentModal(false);
                  router.push("/landing-page#pricing");
                }}
                size="sm"
                variant="default"
                className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white whitespace-nowrap"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                View Plans
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <MenuSystem
        contentRegistry={transportationContentRegistry}
        applicationTitle="Clinical Lab"
        searchPlaceholder="Search..."
        enableSearch={true}
      />
    </>
  );
}

export default function Dashboard() {
  // Allow access to dashboard without subscription
  // Features will be disabled/blocked based on subscription status
  return <DashboardContent />;
}
