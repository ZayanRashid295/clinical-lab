"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function MaintenancePage() {
  return (
    <DashboardLayout activeMenuId="maintenance">
      <UnderConstruction
        menuTitle="Maintenance Management"
        menuIcon="🔧"
        description="Comprehensive vehicle maintenance system for scheduling, tracking, and managing fleet upkeep."
        estimatedCompletion="3 weeks"
        features={[
          "Maintenance scheduling and alerts",
          "Service history tracking",
          "Parts and inventory management",
          "Cost tracking and analytics",
          "Preventive maintenance automation",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
