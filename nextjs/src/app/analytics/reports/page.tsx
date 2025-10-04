"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function ReportsPage() {
  return (
    <DashboardLayout activeMenuId="reports">
      <UnderConstruction
        menuTitle="Reports & Analytics"
        menuIcon="📊"
        description="Comprehensive reporting system for generating detailed analytics and business insights."
        estimatedCompletion="2 weeks"
        features={[
          "Custom report generation",
          "Automated report scheduling",
          "Data visualization and charts",
          "Export capabilities (PDF, Excel, CSV)",
          "Report sharing and collaboration",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
