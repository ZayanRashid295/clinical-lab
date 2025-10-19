import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../../src/shared";
import { rideSharingContentRegistry } from "../../src/app/config/content.registry";

export default function RidesManagement() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const mockRidesData = [
    { id: "1", name: "Downtown Ride", status: "Active" },
    { id: "2", name: "Airport Ride", status: "Pending" },
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
        <title>Rides Management - Uber Portal</title>
        <meta
          name="description"
          content="Comprehensive rides management interface"
        />
        <meta
          name="keywords"
          content="rides, management, transportation, administration"
        />
      </Head>

      <MenuSystem
        contentRegistry={rideSharingContentRegistry}
        applicationTitle="Uber Portal"
        searchPlaceholder="Search rides management..."
        enableSearch={true}
      />
      <div>
        <h2>Mock Rides Management Data</h2>
        <ul>
          {mockRidesData.map((ride) => (
            <li key={ride.id}>
              {ride.name} - {ride.status}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
