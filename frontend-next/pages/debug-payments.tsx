import React from "react";
import PaymentMethodsDebug from "../src/app/components/Debug/PaymentMethodsDebug";
import PaymentMethodsContent from "../src/app/components/Content/PaymentMethodsContent";

/**
 * Debug page for testing payment methods
 * This page includes both the actual payment methods content and debug tools
 */
export default function DebugPaymentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug Component */}
      <PaymentMethodsDebug />

      {/* Actual Payment Methods Content */}
      <PaymentMethodsContent />
    </div>
  );
}
