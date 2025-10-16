"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import StudyMaterialsPage from "@/app/components/study/StudyMaterialsPage";

export default function StudyMaterialsRoute() {
  return (
    <DashboardLayout activeMenuId="study-materials">
      <StudyMaterialsPage />
    </DashboardLayout>
  );
}

