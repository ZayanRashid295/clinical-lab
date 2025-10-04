"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import ShadowModeLegacyContent from "@/shared/components/shadow-mode/shadow-mode-legacy-content";

export default function ShadowModeLegacyPage() {
  return (
    <DashboardLayout activeMenuId="shadow-mode-legacy">
      <ShadowModeLegacyContent isFullScreen={false} />
    </DashboardLayout>
  );
}
