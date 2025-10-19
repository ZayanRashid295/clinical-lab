import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../../src/shared";
import { rideSharingContentRegistry } from "../../src/app/config/content.registry";

export default function ActiveRides() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const mockActiveRidesData = [
    { id: "1", driver: "Alice", location: "Central Park" },
    { id: "2", driver: "Bob", location: "Times Square" },
  ];

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
        <title>Active Rides - Uber Portal</title>
        <meta name="description" content="Monitor and manage active rides" />
        <meta
          name="keywords"
          content="rides, active, transportation, monitoring"
        />
      </Head>

      <MenuSystem
        contentRegistry={rideSharingContentRegistry}
        applicationTitle="Uber Portal"
        searchPlaceholder="Search active rides..."
        enableSearch={true}
      />
      <div>
        <h2>Mock Active Rides Data</h2>
        <ul>
          {mockActiveRidesData.map((ride) => (
            <li key={ride.id}>
              {ride.driver} at {ride.location}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
