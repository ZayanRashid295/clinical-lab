"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import FlashcardsPage from "@/app/components/study/FlashcardsPage";

export default function FlashcardsRoute() {
  return (
    <DashboardLayout activeMenuId="flashcards">
      <FlashcardsPage />
    </DashboardLayout>
  );
}

