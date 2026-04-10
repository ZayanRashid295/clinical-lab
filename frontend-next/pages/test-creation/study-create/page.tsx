import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../../../src/shared";
import { transportationContentRegistry } from "../../../src/app/config/content.registry";

export default function StudyCreateTestPage() {
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

  return (
    <>
      <Head>
        <title>Study Create Test - Clinical Lab</title>
        <meta
          name="description"
          content="Create custom tests with configurable parameters"
        />
      </Head>

      <MenuSystem
        contentRegistry={transportationContentRegistry}
        applicationTitle="Clinical Lab"
      />
    </>
  );
}

