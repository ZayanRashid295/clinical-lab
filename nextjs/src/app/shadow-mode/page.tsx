"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import ShadowModeContent from "@/shared/components/shadow-mode/shadow-mode-content";

export default function ShadowModePage() {
  return (
    <DashboardLayout activeMenuId="shadow-mode">
      <ShadowModeContent isFullScreen={false} />
    </DashboardLayout>
  );
}
