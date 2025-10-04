"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import RidesContent from "@/shared/components/rides/rides-content";

export default function RidesPage() {
  return (
    <DashboardLayout activeMenuId="rides">
      <RidesContent isFullScreen={false} />
    </DashboardLayout>
  );
}
