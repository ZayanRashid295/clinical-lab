"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function PerformancePage() {
  return (
    <DashboardLayout activeMenuId="performance">
      <UnderConstruction
        menuTitle="Performance Analytics"
        menuIcon="📈"
        description="Advanced performance analytics and monitoring system for tracking key metrics and KPIs."
        estimatedCompletion="2 weeks"
        features={[
          "Real-time performance metrics",
          "KPI tracking and monitoring",
          "Performance benchmarking",
          "Trend analysis and forecasting",
          "Custom dashboard creation",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
