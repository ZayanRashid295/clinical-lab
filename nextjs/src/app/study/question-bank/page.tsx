"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import QuestionBankPage from "@/app/components/study/QuestionBankPage";

export default function QuestionBankRoute() {
  return (
    <DashboardLayout activeMenuId="question-bank">
      <QuestionBankPage />
    </DashboardLayout>
  );
}

