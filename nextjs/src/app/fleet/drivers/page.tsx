"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function DriversPage() {
  return (
    <DashboardLayout activeMenuId="drivers">
      <UnderConstruction
        menuTitle="Driver Management"
        menuIcon="👨‍💼"
        description="Comprehensive driver management system for recruitment, training, and performance monitoring."
        estimatedCompletion="3 weeks"
        features={[
          "Driver recruitment and onboarding",
          "Performance monitoring and analytics",
          "Training and certification management",
          "Schedule and availability tracking",
          "Compliance and safety monitoring",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
