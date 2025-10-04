"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function AdminPage() {
  return (
    <DashboardLayout activeMenuId="admin">
      <UnderConstruction
        menuTitle="Admin Panel"
        menuIcon="⚙️"
        description="Comprehensive administrative control panel for system management and configuration."
        estimatedCompletion="2 weeks"
        features={[
          "User management and roles",
          "System configuration",
          "Security settings",
          "Audit logs and monitoring",
          "Data management tools",
          "Performance analytics",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
