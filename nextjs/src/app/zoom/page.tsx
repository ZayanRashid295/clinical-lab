"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import ZoomSimulation from "@/app/components/zoom-simulation/zoom-simulation";

export default function ZoomPage() {
  return (
    <DashboardLayout activeMenuId="zoom-simulation">
      <ZoomSimulation />
    </DashboardLayout>
  );
}
