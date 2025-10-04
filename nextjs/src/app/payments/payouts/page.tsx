"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function PayoutsPage() {
  return (
    <DashboardLayout activeMenuId="payouts">
      <UnderConstruction
        menuTitle="Payouts"
        menuIcon="💰"
        description="Driver payout management system for processing earnings and financial distributions."
        estimatedCompletion="3 weeks"
        features={[
          "Automated payout processing",
          "Earnings calculation and tracking",
          "Payment method management",
          "Payout scheduling",
          "Financial reporting",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
