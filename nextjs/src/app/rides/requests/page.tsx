"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function RideRequestsPage() {
  return (
    <DashboardLayout activeMenuId="ride-requests">
      <UnderConstruction
        menuTitle="Ride Requests"
        menuIcon="📱"
        description="Manage incoming ride requests with intelligent matching and assignment algorithms."
        estimatedCompletion="3 weeks"
        features={[
          "Request management system",
          "Intelligent driver matching",
          "Priority handling",
          "Automated notifications",
          "Request analytics",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
