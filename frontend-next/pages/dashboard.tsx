import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../src/shared";
import { transportationContentRegistry } from "../src/app/config/content.registry";
import { SubscriptionAcknowledgmentModal } from "../src/app/components/SubscriptionAcknowledgmentModal";
import { SubscriptionsService } from "../src/app/services/subscriptions/subscriptions.service";

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showAcknowledgmentModal, setShowAcknowledgmentModal] = useState(false);
  const subscriptionsService = new SubscriptionsService();

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

        // Check for active subscription
        const activeSubscriptions = await subscriptionsService.getUserSubscriptions(
          profile.id,
          "ACTIVE"
        );

        // Show modal if no active subscription
        if (!activeSubscriptions || activeSubscriptions.length === 0) {
          setShowAcknowledgmentModal(true);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        // On error, don't show modal (fail silently)
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [router]);

  if (isLoading) {
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

      <MenuSystem
        contentRegistry={transportationContentRegistry}
        applicationTitle="Clinical Lab"
        searchPlaceholder="Search..."
        enableSearch={true}
      />
    </>
  );
}
