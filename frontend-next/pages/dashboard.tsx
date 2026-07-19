import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../src/shared";
import { appContentRegistry } from "../src/app/config/content.registry";
import { useAccessControl } from "../src/hooks/useAccessControl";
import { Alert, AlertDescription } from "../src/shared/ui/alert";
import { Button } from "../src/shared/ui/button";
import { CreditCard, Lock } from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { hasActiveSubscription, loading: accessLoading } = useAccessControl();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/");
      return;
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - MedPrepAI</title>
        <meta name="description" content="Main dashboard with key metrics and insights" />
      </Head>

      {!hasActiveSubscription && (
        <div className="sticky top-0 z-40 w-full border-b border-primary-200/90 dark:border-primary-800/60">
          <Alert className="border-primary-300/80 bg-primary-50/95 dark:bg-primary-900/20 dark:border-primary-800/50 rounded-none m-0">
            <Lock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <AlertDescription className="flex items-center justify-between w-full py-2">
              <span className="text-primary-900 dark:text-primary-100 text-sm flex-1">
                <strong>No Active Subscription:</strong> Upgrade to unlock full access.
              </span>
              <Button
                onClick={() => router.push("/pricing")}
                size="sm"
                variant="default"
                className="ml-4 bg-primary-600 hover:bg-primary-700 text-white shadow-sm whitespace-nowrap"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                View Plans
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <MenuSystem contentRegistry={appContentRegistry} applicationTitle="MedPrepAI" />
    </>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
