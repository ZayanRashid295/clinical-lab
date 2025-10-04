"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function BillingPage() {
  return (
    <DashboardLayout activeMenuId="billing">
      <UnderConstruction
        menuTitle="Billing"
        menuIcon="🧾"
        description="Comprehensive billing system for managing invoices, payments, and financial records."
        estimatedCompletion="3 weeks"
        features={[
          "Invoice generation and management",
          "Payment tracking and processing",
          "Billing cycle automation",
          "Financial reporting",
          "Customer billing portal",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
