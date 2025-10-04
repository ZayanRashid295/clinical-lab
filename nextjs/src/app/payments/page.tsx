"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function PaymentsPage() {
  return (
    <DashboardLayout activeMenuId="payments">
      <UnderConstruction
        menuTitle="Payments System"
        menuIcon="💳"
        description="Comprehensive payment processing system with secure transactions and financial management."
        estimatedCompletion="4 weeks"
        features={[
          "Secure payment processing",
          "Transaction history and reporting",
          "Payout management for drivers",
          "Billing and invoicing system",
          "Payment method management",
          "Financial analytics and insights",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
