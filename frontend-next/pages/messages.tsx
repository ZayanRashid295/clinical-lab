import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../src/shared";
import { appContentRegistry } from "../src/app/config/content.registry";
export default function MessagesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Faculty Messages — MedPrepAI</title>
      </Head>
      <MenuSystem
        contentRegistry={appContentRegistry}
        applicationTitle="MedPrepAI"
      />
    </>
  );
}
