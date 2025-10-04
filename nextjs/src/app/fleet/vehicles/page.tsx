"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function VehiclesPage() {
  return (
    <DashboardLayout activeMenuId="vehicles">
      <UnderConstruction
        menuTitle="Vehicle Management"
        menuIcon="🚗"
        description="Complete vehicle fleet management system for tracking, maintenance, and optimization."
        estimatedCompletion="3 weeks"
        features={[
          "Vehicle registration and tracking",
          "Maintenance scheduling and alerts",
          "Fuel consumption monitoring",
          "Route optimization",
          "Real-time GPS tracking",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
