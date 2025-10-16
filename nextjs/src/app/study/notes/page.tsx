"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import NotesPage from "@/app/components/study/NotesPage";

export default function NotesRoute() {
  return (
    <DashboardLayout activeMenuId="notes">
      <NotesPage />
    </DashboardLayout>
  );
}

