"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function TransactionsPage() {
  return (
    <DashboardLayout activeMenuId="transactions">
      <UnderConstruction
        menuTitle="Transactions"
        menuIcon="🧾"
        description="Complete transaction history and management system for all payment activities."
        estimatedCompletion="2 weeks"
        features={[
          "Transaction history and records",
          "Payment status tracking",
          "Refund management",
          "Transaction analytics",
          "Export and reporting",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
