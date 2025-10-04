"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import MedAppContent from "@/shared/components/med-app/med-app-content";

export default function MedAppPage() {
  return (
    <DashboardLayout activeMenuId="med-app">
      <MedAppContent isFullScreen={false} />
    </DashboardLayout>
  );
}
