import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../src/shared";
import { RideManagement } from "../src/app/components/Rides";
import { rideSharingContentRegistry } from "../src/app/config/content.registry";

export default function Rides() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    if (!authService.isAuthenticated()) {
      router.replace("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // No need for customContent since we're using contentRegistry

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Rides Management - Uber Portal</title>
        <meta
          name="description"
          content="Monitor and manage ride requests across your platform"
        />
        <meta
          name="keywords"
          content="rides, management, transportation, monitoring"
        />
      </Head>

      <MenuSystem
        contentRegistry={rideSharingContentRegistry}
        applicationTitle="Uber Portal"
        searchPlaceholder="Search by passenger, driver, or location..."
        enableSearch={true}
      />
    </>
  );
}
