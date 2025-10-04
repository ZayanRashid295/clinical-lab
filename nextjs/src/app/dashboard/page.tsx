"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import DashboardContent from "@/shared/components/dashboard/dashboard-content";

export default function DashboardPage() {
  return (
    <DashboardLayout activeMenuId="dashboard">
      <DashboardContent isFullScreen={false} />
    </DashboardLayout>
  );
}
