"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function RevenuePage() {
  return (
    <DashboardLayout activeMenuId="revenue">
      <UnderConstruction
        menuTitle="Revenue Analytics"
        menuIcon="💰"
        description="Comprehensive revenue tracking and financial analytics system for business insights."
        estimatedCompletion="2 weeks"
        features={[
          "Revenue tracking and forecasting",
          "Financial performance metrics",
          "Profit and loss analysis",
          "Revenue optimization insights",
          "Financial reporting and dashboards",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
