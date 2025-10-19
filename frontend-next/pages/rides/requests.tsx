import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../../src/shared";
import { rideSharingContentRegistry } from "../../src/app/config/content.registry";

export default function RideRequests() {
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

  const mockRequestsData = [
    { id: "1", requester: "Alice", destination: "City Center" },
    { id: "2", requester: "Bob", destination: "Museum" },
  ];

  return (
    <>
      <Head>
        <title>Ride Requests - Uber Portal</title>
        <meta name="description" content="Manage ride requests and bookings" />
        <meta
          name="keywords"
          content="rides, requests, transportation, bookings"
        />
      </Head>

      <MenuSystem
        contentRegistry={rideSharingContentRegistry}
        applicationTitle="Uber Portal"
        searchPlaceholder="Search ride requests..."
        enableSearch={true}
      />
      <div>
        <h2>Mock Ride Requests Data</h2>
        <ul>
          {mockRequestsData.map((request) => (
            <li key={request.id}>
              {request.requester} to {request.destination}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
