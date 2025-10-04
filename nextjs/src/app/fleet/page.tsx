"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function FleetPage() {
  return (
    <DashboardLayout activeMenuId="fleet">
      <UnderConstruction
        menuTitle="Fleet Management"
        menuIcon="🚛"
        description="Comprehensive fleet management system for tracking vehicles, drivers, and maintenance schedules."
        estimatedCompletion="3 weeks"
        features={[
          "Vehicle tracking and monitoring",
          "Driver management and scheduling",
          "Maintenance scheduling and alerts",
          "Fuel consumption analytics",
          "Route optimization",
          "Real-time GPS tracking",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
