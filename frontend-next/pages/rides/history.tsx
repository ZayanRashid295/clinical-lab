import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../../src/shared";
import { rideSharingContentRegistry } from "../../src/app/config/content.registry";

export default function RideHistory() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

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
        <title>Ride History - Uber Portal</title>
        <meta name="description" content="View and manage ride history" />
        <meta
          name="keywords"
          content="rides, history, transportation, tracking"
        />
      </Head>

      <MenuSystem
        contentRegistry={rideSharingContentRegistry}
        applicationTitle="Uber Portal"
        searchPlaceholder="Search ride history..."
        enableSearch={true}
      />
      <div>
        <h2>Mock Ride History Data</h2>
        <ul>
          {mockHistoryData.map((history) => (
            <li key={history.id}>
              {history.date}: {history.details}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
