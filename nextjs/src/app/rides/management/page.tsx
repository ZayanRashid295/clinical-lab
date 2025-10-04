"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function RidesManagementPage() {
  return (
    <DashboardLayout activeMenuId="rides-management">
      <UnderConstruction
        menuTitle="Rides Management"
        menuIcon="🎯"
        description="Comprehensive rides management system for administrators to oversee and control all ride operations."
        estimatedCompletion="4 weeks"
        features={[
          "Ride oversight and control",
          "Driver performance monitoring",
          "Route optimization management",
          "Pricing and fare management",
          "Quality assurance tools",
          "Compliance monitoring",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
