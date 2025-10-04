"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function AnalyticsPage() {
  return (
    <DashboardLayout activeMenuId="analytics">
      <UnderConstruction
        menuTitle="Analytics Dashboard"
        menuIcon="📊"
        description="Advanced analytics and reporting system with real-time insights and data visualization."
        estimatedCompletion="2 weeks"
        features={[
          "Real-time performance metrics",
          "Interactive data visualizations",
          "Custom report generation",
          "Trend analysis and forecasting",
          "Export capabilities",
          "Automated alerts and notifications",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
