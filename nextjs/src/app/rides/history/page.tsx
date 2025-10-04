"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function RideHistoryPage() {
  return (
    <DashboardLayout activeMenuId="ride-history">
      <UnderConstruction
        menuTitle="Ride History"
        menuIcon="📋"
        description="Complete history of all rides with detailed analytics and filtering options."
        estimatedCompletion="2 weeks"
        features={[
          "Comprehensive ride records",
          "Advanced filtering and search",
          "Performance analytics",
          "Export capabilities",
          "Rating and feedback system",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
