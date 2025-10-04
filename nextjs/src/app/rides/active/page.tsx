"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function ActiveRidesPage() {
  return (
    <DashboardLayout activeMenuId="active-rides">
      <UnderConstruction
        menuTitle="Active Rides"
        menuIcon="🚗"
        description="Real-time monitoring of all active rides with live tracking and status updates."
        estimatedCompletion="2 weeks"
        features={[
          "Live ride tracking",
          "Real-time status updates",
          "Emergency response system",
          "Driver communication",
          "Route optimization",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
